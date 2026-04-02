from rest_framework import serializers

from .models import FrontendTranslation, Language


class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = ["id", "name", "code", "default"]
        read_only_fields = ["id"]


class FrontendTranslationSerializer(serializers.ModelSerializer):
    language_code = serializers.CharField(source="language.code", read_only=True)

    class Meta:
        model = FrontendTranslation
        fields = ["id", "language", "language_code", "page", "key", "value"]
        read_only_fields = ["id", "language_code"]
