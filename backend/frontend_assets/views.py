from rest_framework import viewsets, permissions
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from config.protobuf import LegacyProtobufParser, ProtobufParser
from users.permissions import CanManageSettings
from .models import (
    Socials,
    Partners,
    HeroSection,
    LogoSection,
    FrequentlyAskedQuestions,
)
from .serializers import (
    SocialsSerializer,
    PartnersSerializer,
    HeroSectionSerializer,
    LogoSectionSerializer,
    FrequentlyAskedQuestionsSerializer,
)

class FrontendAssetPermission(permissions.BasePermission):
    """
    Allow any user to read (GET, HEAD, OPTIONS).
    Require `CanManageSettings` for write operations (POST, PUT, PATCH, DELETE).
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and CanManageSettings().has_permission(request, view)

class SocialsViewSet(viewsets.ModelViewSet):
    queryset = Socials.objects.all().order_by("-created_at")
    serializer_class = SocialsSerializer
    permission_classes = [FrontendAssetPermission]

class PartnersViewSet(viewsets.ModelViewSet):
    queryset = Partners.objects.prefetch_related("partners_translations__language").order_by("-created_at")
    serializer_class = PartnersSerializer
    permission_classes = [FrontendAssetPermission]
    parser_classes = [MultiPartParser, FormParser, JSONParser, ProtobufParser, LegacyProtobufParser]

class HeroSectionViewSet(viewsets.ModelViewSet):
    queryset = HeroSection.objects.all().order_by("-created_at")
    serializer_class = HeroSectionSerializer
    permission_classes = [FrontendAssetPermission]
    parser_classes = [MultiPartParser, FormParser, JSONParser, ProtobufParser, LegacyProtobufParser]

class LogoSectionViewSet(viewsets.ModelViewSet):
    queryset = LogoSection.objects.all().order_by("-created_at")
    serializer_class = LogoSectionSerializer
    permission_classes = [FrontendAssetPermission]
    parser_classes = [MultiPartParser, FormParser, JSONParser, ProtobufParser, LegacyProtobufParser]

class FrequentlyAskedQuestionsViewSet(viewsets.ModelViewSet):
    queryset = FrequentlyAskedQuestions.objects.prefetch_related("frequently_asked_questions_translations__language").order_by("-created_at")
    serializer_class = FrequentlyAskedQuestionsSerializer
    permission_classes = [FrontendAssetPermission]
