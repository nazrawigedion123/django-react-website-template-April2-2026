import json

from rest_framework import serializers

from .models import Blog, BlogSection, BlogSectionTranslation, BlogTranslation, Reaction, BlogComment


class BlogCommentReplySerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = BlogComment
        fields = ["id", "user", "user_name", "content", "created_at", "updated_at", "reply_to"]
        read_only_fields = fields

    def get_user_name(self, obj: BlogComment):
        full_name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return full_name or obj.user.email


class BlogCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    replies = BlogCommentReplySerializer(many=True, read_only=True)

    class Meta:
        model = BlogComment
        fields = ["id", "user", "user_name", "content", "created_at", "updated_at", "replies"]
        read_only_fields = fields

    def get_user_name(self, obj: BlogComment):
        full_name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return full_name or obj.user.email


class BlogSectionSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for BlogSection.

    - ``title`` / ``content`` are the language-resolved values for the current
      request language (or the default language as fallback).
    - ``translations`` is the full list of all stored translations so that the
      dashboard can display / edit them.
    """

    title = serializers.SerializerMethodField()
    content = serializers.SerializerMethodField()
    translations = serializers.SerializerMethodField()

    class Meta:
        model = BlogSection
        fields = ["id", "order", "title", "content", "image", "translations"]
        read_only_fields = ["id"]

    def _get_lang(self):
        request = self.context.get("request")
        if request is None:
            return None
        return (
            request.query_params.get("lang")
            or request.headers.get("X-Lang")
            or request.headers.get("X-Language")
        )

    def get_title(self, obj: BlogSection):
        return obj.get_title(self._get_lang())

    def get_content(self, obj: BlogSection):
        return obj.get_content(self._get_lang())

    def get_translations(self, obj: BlogSection):
        return [
            {
                "code": t.language.code,
                "title": t.title or "",
                "content": t.content or "",
            }
            for t in obj.blog_section_translations.select_related("language").all()
        ]


class BlogSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    content = serializers.SerializerMethodField()
    translations = serializers.SerializerMethodField()
    user_reaction = serializers.SerializerMethodField()
    sections = BlogSectionSerializer(many=True, read_only=True)

    class Meta:
        model = Blog
        fields = [
            "id",
            "author",
            "title",
            "content",
            "comment_count",
            "reaction_count",
            "user_reaction",
            "translations",
            "sections",
            "created_at",
            "updated_at",
            "published_at",
            "published_by",
        ]
        read_only_fields = ["id", "author", "created_at", "updated_at", "published_by"]

    def _translation_for(self, obj: Blog):
        request = self.context.get("request")
        lang = None
        if request is not None:
            lang = request.query_params.get("lang") or request.headers.get("X-Lang") or request.headers.get("X-Language")
        return obj.get_translation(lang)

    def get_title(self, obj: Blog):
        translation = self._translation_for(obj)
        return translation.title if translation else ""

    def get_content(self, obj: Blog):
        translation = self._translation_for(obj)
        return translation.content if translation else ""

    def get_translations(self, obj: Blog):
        return [
            {
                "code": t.language.code,
                "title": t.title or "",
                "content": t.content or "",
            }
            for t in obj.blog_translations.select_related("language").all()
        ]

    def get_user_reaction(self, obj: Blog):
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return None

        prefetched = getattr(obj, "current_user_reactions", None)
        if prefetched is not None:
            if not prefetched:
                return None
            return prefetched[0].reaction_type

        reaction = (
            Reaction.objects.filter(blog=obj, user=request.user)
            .only("reaction_type")
            .first()
        )
        return reaction.reaction_type if reaction else None

    # ------------------------------------------------------------------ #
    # Helpers                                                              #
    # ------------------------------------------------------------------ #

    def _parse_translations(self, data):
        """
        Extract and parse the `translations` field.

        Accepts either a JSON string (FormData) or a pre-parsed list.
        Returns a list of dicts: [{"code": "en", "title": "...", "content": "..."}]
        """
        raw = data.get("translations")
        if raw is None:
            return []
        if isinstance(raw, str):
            try:
                return json.loads(raw)
            except (json.JSONDecodeError, ValueError):
                raise serializers.ValidationError({"translations": "Invalid JSON."})
        return raw

    def _save_translations(self, blog: Blog, translations: list):
        """
        Upsert BlogTranslation rows for the given blog.
        Validates that the default language has a non-empty title.
        """
        from languages.models import Language

        default_lang = Language.objects.filter(default=True).first()

        for entry in translations:
            code = entry.get("code", "")
            title = (entry.get("title") or "").strip()
            content = (entry.get("content") or "").strip()

            if not code:
                continue

            try:
                language = Language.objects.get(code=code)
            except Language.DoesNotExist:
                continue

            # Enforce non-empty title for the default language
            if default_lang and language.id == default_lang.id and not title:
                raise serializers.ValidationError(
                    {"translations": f"Title is required for the default language ({code})."}
                )

            BlogTranslation.objects.update_or_create(
                blog=blog,
                language=language,
                defaults={"title": title or None, "content": content or None},
            )

    def _parse_sections(self, data):
        """
        Extract and parse the `sections` field from FormData.
        """
        raw = data.get("sections")
        if raw is None:
            return None
        if isinstance(raw, str):
            try:
                return json.loads(raw)
            except (json.JSONDecodeError, ValueError):
                raise serializers.ValidationError({"sections": "Invalid JSON."})
        return raw

    def _save_sections(self, blog: Blog, sections_data: list, request=None):
        """
        Upsert / delete BlogSection rows for the given blog, then save
        per-language translations into BlogSectionTranslation.

        Each section entry may contain:
          - id, order, remove_image          — section-level fields
          - translations: [{code, title, content}]  — per-language content
          - (legacy fallback) title / content — stored against the default language
        Attached image files come as ``section_image_<index>`` in request.FILES.
        """
        from languages.models import Language

        files = request.FILES if request else {}
        incoming_ids = set()

        for index, section in enumerate(sections_data):
            section_id = section.get("id")
            image_file = files.get(f"section_image_{index}")
            remove_image = section.get("remove_image", False)

            section_defaults = {
                "order": section.get("order", index),
            }

            if image_file:
                section_defaults["image"] = image_file
            elif remove_image:
                section_defaults["image"] = None

            if section_id:
                try:
                    obj = BlogSection.objects.get(id=section_id, blog=blog)
                    for k, v in section_defaults.items():
                        setattr(obj, k, v)
                    obj.save()
                    incoming_ids.add(obj.id)
                except BlogSection.DoesNotExist:
                    obj = BlogSection.objects.create(blog=blog, **section_defaults)
                    incoming_ids.add(obj.id)
            else:
                obj = BlogSection.objects.create(blog=blog, **section_defaults)
                incoming_ids.add(obj.id)

            # ----------------------------------------------------------
            # Save per-language translations for this section
            # ----------------------------------------------------------
            section_translations = section.get("translations")

            if section_translations:
                # Modern format: [{code, title, content}, ...]
                for t_entry in section_translations:
                    code = (t_entry.get("code") or "").strip()
                    title = (t_entry.get("title") or "").strip()
                    content = (t_entry.get("content") or "").strip()
                    if not code:
                        continue
                    try:
                        language = Language.objects.get(code=code)
                    except Language.DoesNotExist:
                        continue
                    BlogSectionTranslation.objects.update_or_create(
                        blog_section=obj,
                        language=language,
                        defaults={"title": title or None, "content": content or None},
                    )
            else:
                # Legacy fallback: flat title/content → default language
                flat_title = (section.get("title") or "").strip()
                flat_content = (section.get("content") or "").strip()
                if flat_title or flat_content:
                    default_lang = Language.objects.filter(default=True).first()
                    if default_lang:
                        BlogSectionTranslation.objects.update_or_create(
                            blog_section=obj,
                            language=default_lang,
                            defaults={
                                "title": flat_title or None,
                                "content": flat_content or None,
                            },
                        )

        # Remove sections no longer in the payload
        blog.sections.exclude(id__in=incoming_ids).delete()

    # ------------------------------------------------------------------ #
    # Write operations                                                     #
    # ------------------------------------------------------------------ #

    def create(self, validated_data):
        request = self.context.get("request")
        raw_data = request.data if request else {}

        translations = self._parse_translations(raw_data)
        sections_data = self._parse_sections(raw_data)

        blog = Blog.objects.create(author=request.user)

        if translations:
            self._save_translations(blog, translations)

        if sections_data is not None:
            self._save_sections(blog, sections_data, request)

        return blog

    def update(self, instance, validated_data):
        request = self.context.get("request")
        raw_data = request.data if request else {}

        translations = self._parse_translations(raw_data)
        sections_data = self._parse_sections(raw_data)

        if translations:
            self._save_translations(instance, translations)

        if sections_data is not None:
            self._save_sections(instance, sections_data, request)

        instance.save()
        return instance
