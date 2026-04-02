# from rest_framework import mixins, permissions, viewsets


# from .models import Blog
# from .serializers import BlogSerializer


# class BlogViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
#     serializer_class = BlogSerializer
#     permission_classes = [permissions.AllowAny]
#     queryset = Blog.objects.select_related("author", "published_by").prefetch_related(
#         "blog_translations__language"
#     )
from rest_framework import mixins, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Prefetch
from django.utils import timezone
from .models import Blog, BlogComment, Reaction
from .serializers import BlogSerializer, BlogCommentSerializer
from .permissions import (
    CanCreateBlog, 
    IsAuthorAndCanEditBlog, 
    CanDeleteBlog, 
    CanPublishBlog
)

class BlogViewSet(mixins.ListModelMixin, 
                  mixins.RetrieveModelMixin, 
                  mixins.CreateModelMixin,
                  mixins.UpdateModelMixin,
                  mixins.DestroyModelMixin,
                  viewsets.GenericViewSet):
    
    serializer_class = BlogSerializer
    queryset = Blog.objects.select_related("author", "published_by").prefetch_related(
        "blog_translations__language",
        "sections",
        "sections__blog_section_translations__language",
    )

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_authenticated:
            queryset = queryset.prefetch_related(
                Prefetch(
                    "reactions",
                    queryset=Reaction.objects.filter(user=self.request.user).only(
                        "id", "blog_id", "reaction_type"
                    ),
                    to_attr="current_user_reactions",
                )
            )
        if self.action in ["list", "retrieve"]:
            return queryset.filter(published_at__isnull=False)
        return queryset

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        elif self.action == 'create':
            permission_classes = [CanCreateBlog]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsAuthorAndCanEditBlog]
        elif self.action == 'destroy':
            permission_classes = [CanDeleteBlog]
        elif self.action == 'publish':
            permission_classes = [CanPublishBlog]
        elif self.action == "comments" and self.request.method == "GET":
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated]
            
        return [permission() for permission in permission_classes]

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        blog = self.get_object()
        blog.published_at = timezone.now()
        blog.published_by = request.user
        blog.save(update_fields=["published_at", "published_by", "updated_at"])
        serializer = self.get_serializer(blog)
        return Response(serializer.data)

    @action(
        detail=True,
        methods=["get", "post"],
        url_path="comments",
    )
    def comments(self, request, pk=None):
        blog = self.get_object()
        if request.method == "GET":
            queryset = (
                BlogComment.objects.filter(blog=blog, reply_to__isnull=True)
                .select_related("user")
                .prefetch_related(
                    Prefetch(
                        "replies",
                        queryset=BlogComment.objects.select_related("user").order_by("created_at"),
                    )
                )
                .order_by("-created_at")
            )
            serializer = BlogCommentSerializer(queryset, many=True)
            return Response(serializer.data)

        content = (request.data.get("content") or "").strip()
        if not content:
            return Response(
                {"detail": "Comment content is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reply_to_id = request.data.get("reply_to")
        reply_to = None
        if reply_to_id is not None:
            try:
                reply_to = BlogComment.objects.get(id=reply_to_id, blog=blog)
            except (TypeError, ValueError, BlogComment.DoesNotExist):
                return Response(
                    {"detail": "Invalid reply_to comment."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        comment = BlogComment.objects.create(
            blog=blog,
            user=request.user,
            content=content,
            reply_to=reply_to,
        )
        blog.refresh_from_db(fields=["comment_count", "reaction_count"])
        return Response(
            {
                "id": comment.id,
                "content": comment.content,
                "reply_to": comment.reply_to_id,
                "created_at": comment.created_at,
                "comment_count": blog.comment_count,
                "reaction_count": blog.reaction_count,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[permissions.IsAuthenticated],
        url_path="reactions",
    )
    def reactions(self, request, pk=None):
        blog = self.get_object()
        reaction_type = (request.data.get("reaction_type") or "").strip().lower()
        valid_reactions = {choice[0] for choice in Reaction.REACTION_CHOICES}
        if reaction_type not in valid_reactions:
            return Response(
                {
                    "detail": "Invalid reaction_type.",
                    "allowed": sorted(valid_reactions),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing = Reaction.objects.filter(blog=blog, user=request.user).first()
        action_name = "created"
        current_reaction = reaction_type
        reaction_id = None

        if existing and existing.reaction_type == reaction_type:
            reaction_id = existing.id
            existing.delete()
            action_name = "removed"
            current_reaction = None
        elif existing:
            existing.reaction_type = reaction_type
            existing.save()
            reaction_id = existing.id
            action_name = "updated"
        else:
            created_reaction = Reaction.objects.create(
                blog=blog,
                user=request.user,
                reaction_type=reaction_type,
            )
            reaction_id = created_reaction.id
            action_name = "created"

        blog.refresh_from_db(fields=["comment_count", "reaction_count"])
        return Response(
            {
                "id": reaction_id,
                "reaction_type": current_reaction,
                "action": action_name,
                "current_reaction": current_reaction,
                "comment_count": blog.comment_count,
                "reaction_count": blog.reaction_count,
            }
        )
