from rest_framework import permissions, viewsets

from .models import FrontendTranslation, Language
from .serializers import FrontendTranslationSerializer, LanguageSerializer


class LanguageViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LanguageSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Language.objects.all().order_by("-default", "name")


class TranslationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = FrontendTranslationSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = FrontendTranslation.objects.select_related("language")
        lang = (
            self.request.query_params.get("lang")
            or self.request.headers.get("X-Lang")
            or self.request.headers.get("X-Language")
        )
        page = self.request.query_params.get("page")

        if lang:
            queryset = queryset.filter(language__code=lang)
        if page:
            queryset = queryset.filter(page=page)

        return queryset.order_by("page", "key")
