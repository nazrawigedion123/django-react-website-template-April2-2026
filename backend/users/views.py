from django.contrib.auth import get_user_model
from django.conf import settings
import json
import logging
import requests
from django.db.models import Prefetch
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from blogs.models import Blog, BlogSection, BlogTranslation, Reaction
from blogs.permissions import CanCreateBlog, CanDeleteBlog, CanEditBlog, CanPublishBlog
from blogs.serializers import BlogSerializer
from gallery.models import (
    Pictures,
    PicturesTranslation,
    Videos,
    VideosTranslation,
    YoutubeVideos,
)
from gallery.permissions import CanManageMedia
from gallery.serializers import PicturesSerializer, VideosSerializer, YoutubeVideosSerializer
from languages.models import Language
from users.permissions import CanManageUsers
from users.models import UserRoles
from .serializers import RegisterSerializer, UserSerializer
from django.utils import timezone
from config.protobuf import LegacyProtobufParser, ProtobufParser

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()

    def get_serializer_class(self):
        if self.action == "create":
            return RegisterSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class GoogleLoginView(APIView):
    def post(self, request):
        logger = logging.getLogger(__name__)
        code = request.data.get("code")
        verifier = request.data.get("code_verifier")

        token_url = settings.GOOGLE_TOKEN_URL
        userinfo_url = settings.GOOGLE_USERINFO_URL

        if not code or not verifier:
            return Response(
                {"detail": "Both code and code_verifier are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not token_url or not userinfo_url:
            logger.error("Google OAuth settings are missing required endpoint URLs.")
            return Response(
                {"detail": "Google authentication is not configured on the server."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        data = {
            "code": code,
            "code_verifier": verifier,
            "client_id": settings.SOCIAL_AUTH_GOOGLE_CLIENT_ID,
            "client_secret": settings.SOCIAL_AUTH_GOOGLE_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URL,
            "grant_type": "authorization_code",
        }

        if not data["client_id"] or not data["client_secret"] or not data["redirect_uri"]:
            logger.error("Google OAuth settings are missing client_id, client_secret, or redirect_uri.")
            return Response(
                {"detail": "Google authentication is not fully configured on the server."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        try:
            token_response = requests.post(token_url, data=data, timeout=15)
            google_resp = token_response.json()
        except requests.RequestException as exc:
            logger.exception("Google token request failed: %s", exc)
            return Response(
                {"detail": "Failed to contact Google token endpoint."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except ValueError:
            logger.error("Google token endpoint returned non-JSON response.")
            return Response(
                {"detail": "Google token endpoint returned an invalid response."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        logger.info(f"Google Token Response: {google_resp}")
        if "access_token" not in google_resp:
            logger.error(f"Google Token Error: {google_resp}")
            return Response(
                {"detail": f"Failed to authenticate with Google: {google_resp.get('error_description', google_resp.get('error', 'Unknown error'))}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        access_token = google_resp["access_token"]
        
        try:
            user_info_resp = requests.get(
                userinfo_url,
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=15,
            )
        except requests.RequestException as exc:
            logger.exception("Google userinfo request failed: %s", exc)
            return Response(
                {"detail": "Failed to fetch user info from Google."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        
        if user_info_resp.status_code != 200:
            logger.error(f"Google User Info Error: {user_info_resp.text}")
            return Response(
                {"detail": "Failed to fetch user info from Google."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user_info = user_info_resp.json()
        logger.info(f"Google User Info: {user_info}")

        email = user_info.get("email")
        if not email:
            logger.error(f"Google User Info Missing Email: {user_info}")
            return Response({"detail": "Google did not return an email address."}, status=status.HTTP_400_BAD_REQUEST)

        user, _created = User.objects.get_or_create(
            email=email,
            defaults={
                "first_name": user_info.get("given_name", ""),
                "last_name": user_info.get("family_name", ""),
            },
        )

        token = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "refresh": str(token),
                "access": str(token.access_token),
            }
        )



class LoggingMixin:
    """Mixin to log the user and action for every request to the view."""

    def initial(self, request, *args, **kwargs):
        logger = logging.getLogger(__name__)
        logger.info(
            f"User: {request.user} | "
            f"View: {self.__class__.__name__} | "
            f"Action: {getattr(self, 'action', 'N/A')} | "
            f"Method: {request.method}"
        )
        super().initial(request, *args, **kwargs)


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser, ProtobufParser, LegacyProtobufParser]

    def get_permissions(self):
        # Blog detail (PUT=edit, DELETE=delete) — check per-method inside the action
        if self.action == "blog_detail":
            if self.request.method == "PUT":
                return [permissions.IsAuthenticated(), CanEditBlog()]
            if self.request.method == "DELETE":
                return [permissions.IsAuthenticated(), CanDeleteBlog()]
        # Blog list/create — POST requires CanCreateBlog
        if self.action == "blogs" and self.request.method == "POST":
            return [permissions.IsAuthenticated(), CanCreateBlog()]
        if self.action == "publish_blog":
            return [permissions.IsAuthenticated(), CanPublishBlog()]
        if self.action in [
            "upload_picture",
            "upload_video",
            "upload_youtube",
            "picture_detail",
            "video_detail",
            "youtube_detail",
            "delete_picture",
            "delete_video",
        ]:
            return [permissions.IsAuthenticated(), CanManageMedia()]
        if self.action == "users" and self.request.method == "GET":
            return [permissions.IsAuthenticated(), CanManageUsers()]
        if self.action == "user_detail" and self.request.method == "PUT":
            return [permissions.IsAuthenticated(), CanManageUsers()]
        return [permissions.IsAuthenticated()]

    def _lang_from_request(self, request):
        return (
            request.query_params.get("lang")
            or request.headers.get("X-Lang")
            or request.headers.get("X-Language")
        )

    def _resolve_language(self, request):
        lang_code = self._lang_from_request(request)
        if lang_code:
            language = Language.objects.filter(code=lang_code).first()
            if language:
                return language
        user_language = request.user.get_language()
        if user_language:
            return user_language
        return Language.objects.filter(default=True).first() or Language.objects.first()

    def _parse_media_translations(self, request):
        raw = request.data.get("translations")
        if raw is None:
            raise serializers.ValidationError({"translations": "translations is required."})
        if isinstance(raw, str):
            raw = raw.strip()
            if not raw:
                raise serializers.ValidationError({"translations": "translations is required."})
            try:
                raw = json.loads(raw)
            except json.JSONDecodeError:
                raise serializers.ValidationError({"translations": "Invalid JSON."})
        if not isinstance(raw, list):
            raise serializers.ValidationError({"translations": "Must be an array."})
        return raw

    def _save_media_translations(self, media_obj, translations, media_kind):
        default_language = Language.objects.filter(default=True).first()
        if default_language is None:
            raise serializers.ValidationError({"translations": "No default language configured."})

        if media_kind == "picture":
            translation_model = PicturesTranslation
            parent_field = "picture"
        else:
            translation_model = VideosTranslation
            parent_field = "video"

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

            if language.id != default_language.id and not title and not description:
                continue

            filters = {parent_field: media_obj, "language": language}
            translation_model.objects.update_or_create(
                **filters,
                defaults={"title": title, "description": description},
            )

        if not has_default:
            raise serializers.ValidationError(
                {"translations": f"Default language translation ({default_language.code}) is required."}
            )

    def _update_media_item(self, request, pk, media_kind):
        if media_kind == "picture":
            model = Pictures
            file_key = "image"
            serializer_cls = PicturesSerializer
        else:
            model = Videos
            file_key = "video"
            serializer_cls = VideosSerializer

        media_obj = model.objects.prefetch_related(f"{media_kind}s_translations__language").filter(pk=pk).first()
        if not media_obj:
            return Response({"detail": f"{media_kind.capitalize()} not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.method == "DELETE":
            file_field = getattr(media_obj, file_key, None)
            if file_field:
                file_field.delete(save=False)
            media_obj.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        try:
            translations = self._parse_media_translations(request)
            uploaded_file = request.FILES.get(file_key)
            if uploaded_file is not None:
                existing_file = getattr(media_obj, file_key, None)
                if existing_file:
                    existing_file.delete(save=False)
                setattr(media_obj, file_key, uploaded_file)
                media_obj.save(update_fields=[file_key, "updated_at"])
            self._save_media_translations(media_obj, translations, media_kind)
        except serializers.ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)

        serializer = serializer_cls(media_obj, context={"request": request})
        return Response(serializer.data)

    @action(detail=False, methods=["get", "post"], url_path="blogs")
    def blogs(self, request):
        """GET: list all blogs. POST: create a new blog."""
        if request.method == "POST":
            return self._create_blog(request)
        # GET
        queryset = Blog.objects.select_related("author", "published_by").prefetch_related(
            "blog_translations__language",
            "sections",
            "sections__blog_section_translations__language",
            Prefetch(
                "reactions",
                queryset=Reaction.objects.filter(user=request.user).only(
                    "id", "blog_id", "reaction_type"
                ),
                to_attr="current_user_reactions",
            ),
        )
        serializer = BlogSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data)

    def _parse_sections_payload(self, request):
        raw_sections = request.data.get("sections", [])
        if isinstance(raw_sections, str):
            raw_sections = raw_sections.strip()
            if not raw_sections:
                return []
            try:
                raw_sections = json.loads(raw_sections)
            except json.JSONDecodeError:
                raise ValueError("Invalid sections payload.")

        if raw_sections is None:
            return []
        if not isinstance(raw_sections, list):
            raise ValueError("Sections must be an array.")
        return raw_sections

    def _truthy(self, value):
        if isinstance(value, bool):
            return value
        if value is None:
            return False
        return str(value).lower() in {"1", "true", "yes", "on"}

    def _save_sections(self, blog, sections_payload, files, replace=False):
        existing = {section.id: section for section in blog.sections.all()} if replace else {}
        seen_ids = set()

        for idx, item in enumerate(sections_payload):
            if not isinstance(item, dict):
                continue

            section = None
            section_id = item.get("id")
            if replace and section_id is not None:
                try:
                    section = existing.get(int(section_id))
                except (TypeError, ValueError):
                    section = None
                if section is not None:
                    seen_ids.add(section.id)

            if section is None:
                section = BlogSection(blog=blog)

            try:
                section.order = int(item.get("order", idx))
            except (TypeError, ValueError):
                section.order = idx
            section.title = (item.get("title") or "").strip()
            section.content = (item.get("content") or "").strip()

            remove_image = self._truthy(item.get("remove_image"))
            image_file = files.get(f"section_image_{idx}")

            if image_file is not None:
                if section.image:
                    section.image.delete(save=False)
                section.image = image_file
            elif remove_image and section.image:
                section.image.delete(save=False)
                section.image = None

            section.save()

        if replace:
            for section_id, section in existing.items():
                if section_id not in seen_ids:
                    if section.image:
                        section.image.delete(save=False)
                    section.delete()

    def _create_blog(self, request):
        serializer = BlogSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        try:
            serializer.save()
        except serializers.ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["put", "delete"], url_path="blogs")
    def blog_detail(self, request, pk=None):
        """PUT: update a blog translation. DELETE: remove a blog."""
        if request.method == "DELETE":
            return self._delete_blog(request, pk)
        return self._update_blog(request, pk)

    def _update_blog(self, request, pk):
        blog = Blog.objects.prefetch_related("sections").filter(pk=pk).first()
        if not blog:
            return Response({"detail": "Blog not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = BlogSerializer(blog, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        try:
            serializer.save()
        except serializers.ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.data)

    def _delete_blog(self, request, pk):
        blog = Blog.objects.filter(pk=pk).first()
        if not blog:
            return Response({"detail": "Blog not found."}, status=status.HTTP_404_NOT_FOUND)
        blog.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="blogs/publish")
    def publish_blog(self, request, pk=None):
        blog = Blog.objects.filter(pk=pk).first()
        if not blog:
            return Response({"detail": "Blog not found."}, status=status.HTTP_404_NOT_FOUND)

        blog.published_at = timezone.now()
        blog.published_by = request.user
        blog.save(update_fields=["published_at", "published_by", "updated_at"])

        serializer = BlogSerializer(blog, context={"request": request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="media")
    def media(self, request):
        pictures = Pictures.objects.prefetch_related("pictures_translations__language")
        videos = Videos.objects.prefetch_related("videos_translations__language")
        youtube_videos = YoutubeVideos.objects.prefetch_related("youtubevideos_translations__language")
        picture_data = PicturesSerializer(pictures, many=True, context={"request": request}).data
        video_data = VideosSerializer(videos, many=True, context={"request": request}).data
        youtube_data = YoutubeVideosSerializer(youtube_videos, many=True, context={"request": request}).data
        return Response({"pictures": picture_data, "videos": video_data, "youtube_videos": youtube_data})

    @action(detail=False, methods=["get"], url_path="users")
    def users(self, request):
        queryset = User.objects.all().order_by("date_joined")
        serializer = UserSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["put"], url_path="users")
    def user_detail(self, request, pk=None):
        user = User.objects.filter(pk=pk).first()
        if not user:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        payload = request.data.get("roles")
        if payload is None:
            payload = request.data
        if not isinstance(payload, dict):
            return Response({"detail": "Invalid roles payload."}, status=status.HTTP_400_BAD_REQUEST)

        editable_fields = [
            "can_create_blog",
            "can_edit_blog",
            "can_delete_blog",
            "can_publish_blog",
            "can_manage_users",
            "can_create_media",
            "can_edit_media",
            "can_delete_media",
            "can_manage_subscribers",
            "can_manage_contacts",
            "can_manage_settings",
        ]
        boolean_fields = set(editable_fields)

        role, _ = UserRoles.objects.get_or_create(user=user)
        for field in editable_fields:
            if field in payload:
                value = payload.get(field)
                if field in boolean_fields and not isinstance(value, bool):
                    value = str(value).lower() in {"1", "true", "yes", "on"}
                setattr(role, field, value)
        role.save()

        serializer = UserSerializer(user)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="media/pictures")
    def upload_picture(self, request):
        image = request.FILES.get("image")
        if image is None:
            return Response({"detail": "image is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            translations = self._parse_media_translations(request)
            picture = Pictures.objects.create(image=image)
            self._save_media_translations(picture, translations, "picture")
        except serializers.ValidationError as exc:
            if "picture" in locals():
                picture.delete()
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)

        serializer = PicturesSerializer(picture, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"], url_path="media/videos")
    def upload_video(self, request):
        video_file = request.FILES.get("video")
        if video_file is None:
            return Response({"detail": "video is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            translations = self._parse_media_translations(request)
            video = Videos.objects.create(video=video_file)
            self._save_media_translations(video, translations, "video")
        except serializers.ValidationError as exc:
            if "video" in locals():
                video.delete()
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)

        serializer = VideosSerializer(video, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["put", "delete"], url_path="media/pictures")
    def picture_detail(self, request, pk=None):
        return self._update_media_item(request, pk, "picture")

    @action(detail=True, methods=["put", "delete"], url_path="media/videos")
    def video_detail(self, request, pk=None):
        return self._update_media_item(request, pk, "video")

    @action(detail=False, methods=["post"], url_path="media/youtube")
    def upload_youtube(self, request):
        serializer = YoutubeVideosSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        youtube_video = serializer.save()
        read_serializer = YoutubeVideosSerializer(youtube_video, context={"request": request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["put", "delete"], url_path="media/youtube")
    def youtube_detail(self, request, pk=None):
        youtube_video = YoutubeVideos.objects.prefetch_related("youtubevideos_translations__language").filter(pk=pk).first()
        if not youtube_video:
            return Response({"detail": "Youtube video not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.method == "DELETE":
            youtube_video.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        serializer = YoutubeVideosSerializer(
            youtube_video,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        youtube_video = serializer.save()
        read_serializer = YoutubeVideosSerializer(youtube_video, context={"request": request})
        return Response(read_serializer.data)
