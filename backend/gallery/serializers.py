import json
import re

from rest_framework import serializers
from rest_framework.reverse import reverse

from languages.models import Language
from .models import (
    Pictures,
    Videos,
    YoutubeVideos,
    YoutubeVideosTranslation,
)


EMBED_IFRAME_RE = re.compile(
    r'<iframe[^>]+src=["\']https://(?:www\.)?(?:youtube\.com|youtube-nocookie\.com)/embed/[^"\']+["\'][^>]*></iframe>',
    re.IGNORECASE,
)


class PicturesSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    translations = serializers.SerializerMethodField()

    class Meta:
        model = Pictures
        fields = ["id", "image", "title", "description", "translations", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def _translation_for(self, obj: Pictures):
        request = self.context.get("request")
        lang = None
        if request is not None:
            lang = request.query_params.get("lang") or request.headers.get("X-Lang") or request.headers.get("X-Language")
        return obj.get_translation(lang)

    def get_title(self, obj: Pictures):
        translation = self._translation_for(obj)
        return translation.title if translation else ""

    def get_description(self, obj: Pictures):
        translation = self._translation_for(obj)
        return translation.description if translation else ""

    def get_translations(self, obj: Pictures):
        return [
            {
                "code": t.language.code,
                "title": t.title,
                "description": t.description,
            }
            for t in obj.pictures_translations.select_related("language").all()
        ]


class VideosSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    stream_url = serializers.SerializerMethodField()
    translations = serializers.SerializerMethodField()

    class Meta:
        model = Videos
        fields = ["id", "video", "stream_url", "title", "description", "translations", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def _translation_for(self, obj: Videos):
        request = self.context.get("request")
        lang = None
        if request is not None:
            lang = request.query_params.get("lang") or request.headers.get("X-Lang") or request.headers.get("X-Language")
        return obj.get_translation(lang)

    def get_title(self, obj: Videos):
        translation = self._translation_for(obj)
        return translation.title if translation else ""

    def get_description(self, obj: Videos):
        translation = self._translation_for(obj)
        return translation.description if translation else ""

    def get_stream_url(self, obj: Videos):
        request = self.context.get("request")
        if request is None:
            return f"/api/gallery/{obj.id}/stream/"
        return reverse("gallery-stream-video", kwargs={"pk": obj.id}, request=request)

    def get_translations(self, obj: Videos):
        return [
            {
                "code": t.language.code,
                "title": t.title,
                "description": t.description,
            }
            for t in obj.videos_translations.select_related("language").all()
        ]


class YoutubeVideosSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    translations = serializers.SerializerMethodField()

    class Meta:
        model = YoutubeVideos
        fields = ["id", "video", "title", "description", "translations", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def _translation_for(self, obj: YoutubeVideos):
        request = self.context.get("request")
        lang = None
        if request is not None:
            lang = request.query_params.get("lang") or request.headers.get("X-Lang") or request.headers.get("X-Language")
        return obj.get_translation(lang)

    def get_title(self, obj: YoutubeVideos):
        translation = self._translation_for(obj)
        return translation.title if translation else ""

    def get_description(self, obj: YoutubeVideos):
        translation = self._translation_for(obj)
        return translation.description if translation else ""

    def get_translations(self, obj: YoutubeVideos):
        return [
            {
                "code": t.language.code,
                "title": t.title,
                "description": t.description,
            }
            for t in obj.youtubevideos_translations.select_related("language").all()
        ]

    def validate_video(self, value: str):
        if not value or not EMBED_IFRAME_RE.search(value.strip()):
            raise serializers.ValidationError(
                "Video must be a YouTube iframe embed code, e.g. <iframe src='https://www.youtube.com/embed/...'></iframe>."
            )
        return value.strip()

    def _parse_translations(self, data):
        raw = data.get("translations")
        if raw is None:
            return None
        if isinstance(raw, str):
            try:
                raw = json.loads(raw)
            except json.JSONDecodeError:
                raise serializers.ValidationError({"translations": "Invalid JSON."})
        if not isinstance(raw, list):
            raise serializers.ValidationError({"translations": "Must be an array."})
        return raw

    def _save_translations(self, youtube_video: YoutubeVideos, translations: list):
        default_language = Language.objects.filter(default=True).first()
        if default_language is None:
            raise serializers.ValidationError({"translations": "No default language configured."})

        has_default = False
        for entry in translations:
            if not isinstance(entry, dict):
                continue

            code = (entry.get("code") or "").strip()
            if not code:
                continue

            language = Language.objects.filter(code=code).first()
            if language is None:
                raise serializers.ValidationError({"translations": f"Unknown language code: {code}"})

            title = (entry.get("title") or "").strip()
            description = (entry.get("description") or "").strip()

            if language.id == default_language.id:
                has_default = True
                if not title:
                    raise serializers.ValidationError(
                        {"translations": f"Title is required for the default language ({code})."}
                    )

            YoutubeVideosTranslation.objects.update_or_create(
                youtubevideo=youtube_video,
                language=language,
                defaults={"title": title, "description": description},
            )

        if not has_default:
            raise serializers.ValidationError(
                {"translations": f"Default language translation ({default_language.code}) is required."}
            )

    def create(self, validated_data):
        translations = self._parse_translations(self.initial_data)
        if not translations:
            raise serializers.ValidationError({"translations": "At least default language translation is required."})
        youtube_video = YoutubeVideos.objects.create(**validated_data)
        try:
            self._save_translations(youtube_video, translations)
        except serializers.ValidationError:
            youtube_video.delete()
            raise
        return youtube_video

    def update(self, instance, validated_data):
        translations = self._parse_translations(self.initial_data)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if translations is not None:
            self._save_translations(instance, translations)
        return instance
