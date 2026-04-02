import json

from rest_framework import serializers

from languages.models import Language
from .models import (
    FrequentlyAskedQuestions,
    FrequentlyAskedQuestionsTranslation,
    HeroSection,
    LogoSection,
    Partners,
    PartnersTranslation,
    Socials,
)


class SocialsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Socials
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class HeroSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeroSection
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        if self.instance is None and HeroSection.objects.exists():
            raise serializers.ValidationError({"detail": "Only one hero section record is allowed."})
        return attrs


class LogoSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LogoSection
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        if self.instance is None and LogoSection.objects.exists():
            raise serializers.ValidationError({"detail": "Only one logo record is allowed."})
        return attrs


class PartnersSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    translations = serializers.SerializerMethodField()

    class Meta:
        model = Partners
        fields = ["id", "image", "url", "name", "description", "translations", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def _translation_for(self, obj: Partners):
        request = self.context.get("request")
        lang = None
        if request is not None:
            lang = request.query_params.get("lang") or request.headers.get("X-Lang") or request.headers.get("X-Language")
        return obj.get_translation(lang)

    def get_name(self, obj: Partners):
        translation = self._translation_for(obj)
        return translation.name if translation else ""

    def get_description(self, obj: Partners):
        translation = self._translation_for(obj)
        return translation.description if translation else ""

    def get_translations(self, obj: Partners):
        return [
            {
                "code": t.language.code,
                "name": t.name,
                "description": t.description,
            }
            for t in obj.partners_translations.select_related("language").all()
        ]

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

    def _save_translations(self, partner: Partners, translations: list):
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

            name = (entry.get("name") or "").strip()
            description = (entry.get("description") or "").strip()
            if language.id == default_language.id:
                has_default = True
                if not name:
                    raise serializers.ValidationError(
                        {"translations": f"Name is required for the default language ({code})."}
                    )

            PartnersTranslation.objects.update_or_create(
                partner=partner,
                language=language,
                defaults={"name": name, "description": description},
            )

        if not has_default:
            raise serializers.ValidationError(
                {"translations": f"Default language translation ({default_language.code}) is required."}
            )

    def create(self, validated_data):
        raw_data = self.initial_data
        translations = self._parse_translations(raw_data)
        if not translations:
            raise serializers.ValidationError({"translations": "At least default language translation is required."})
        partner = Partners.objects.create(**validated_data)
        try:
            self._save_translations(partner, translations)
        except serializers.ValidationError:
            partner.delete()
            raise
        return partner

    def update(self, instance, validated_data):
        raw_data = self.initial_data
        translations = self._parse_translations(raw_data)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if translations is not None:
            self._save_translations(instance, translations)
        return instance


class FrequentlyAskedQuestionsSerializer(serializers.ModelSerializer):
    question = serializers.SerializerMethodField()
    answer = serializers.SerializerMethodField()
    translations = serializers.SerializerMethodField()

    class Meta:
        model = FrequentlyAskedQuestions
        fields = ["id", "question", "answer", "translations", "active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def _translation_for(self, obj: FrequentlyAskedQuestions):
        request = self.context.get("request")
        lang = None
        if request is not None:
            lang = request.query_params.get("lang") or request.headers.get("X-Lang") or request.headers.get("X-Language")
        return obj.get_translation(lang)

    def get_question(self, obj: FrequentlyAskedQuestions):
        translation = self._translation_for(obj)
        return translation.question if translation else ""

    def get_answer(self, obj: FrequentlyAskedQuestions):
        translation = self._translation_for(obj)
        return translation.answer if translation else ""

    def get_translations(self, obj: FrequentlyAskedQuestions):
        return [
            {
                "code": t.language.code,
                "question": t.question,
                "answer": t.answer,
            }
            for t in obj.frequently_asked_questions_translations.select_related("language").all()
        ]

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

    def _save_translations(self, faq: FrequentlyAskedQuestions, translations: list):
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

            question = (entry.get("question") or "").strip()
            answer = (entry.get("answer") or "").strip()
            if language.id == default_language.id:
                has_default = True
                if not question:
                    raise serializers.ValidationError(
                        {"translations": f"Question is required for the default language ({code})."}
                    )

            FrequentlyAskedQuestionsTranslation.objects.update_or_create(
                frequently_asked_question=faq,
                language=language,
                defaults={"question": question, "answer": answer},
            )

        if not has_default:
            raise serializers.ValidationError(
                {"translations": f"Default language translation ({default_language.code}) is required."}
            )

    def create(self, validated_data):
        raw_data = self.initial_data
        translations = self._parse_translations(raw_data)
        if not translations:
            raise serializers.ValidationError({"translations": "At least default language translation is required."})
        faq = FrequentlyAskedQuestions.objects.create(**validated_data)
        try:
            self._save_translations(faq, translations)
        except serializers.ValidationError:
            faq.delete()
            raise
        return faq

    def update(self, instance, validated_data):
        raw_data = self.initial_data
        translations = self._parse_translations(raw_data)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if translations is not None:
            self._save_translations(instance, translations)
        return instance
