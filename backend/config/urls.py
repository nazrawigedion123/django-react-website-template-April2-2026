"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from blogs.views import BlogViewSet
from contacts.views import ContactViewSet, SubscriberViewSet
from gallery.views import GalleryViewSet
from frontend_assets.views import (
    FrequentlyAskedQuestionsViewSet,
    HeroSectionViewSet,
    LogoSectionViewSet,
    PartnersViewSet,
    SocialsViewSet,
)
from languages.views import LanguageViewSet, TranslationViewSet
from users.views import UserViewSet, GoogleLoginView, DashboardViewSet
from users.auth_views import MyTokenObtainPairView
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'blogs', BlogViewSet, basename='blog')
router.register(r'gallery', GalleryViewSet, basename='gallery')
router.register(r"contacts", ContactViewSet, basename="contact")
router.register(r"subscribers", SubscriberViewSet, basename="subscriber")
router.register(r"socials", SocialsViewSet, basename="social")
router.register(r"partners", PartnersViewSet, basename="partner")
router.register(r"hero-section", HeroSectionViewSet, basename="hero-section")
router.register(r"logo-section", LogoSectionViewSet, basename="logo-section")
router.register(r"faqs", FrequentlyAskedQuestionsViewSet, basename="faq")
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'translations', TranslationViewSet, basename='translation')
router.register(r'languages', LanguageViewSet, basename='language')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/google/login/', GoogleLoginView.as_view(), name='google_login'),
    # JWT Auth:
    path('api/login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Swagger UI:
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
