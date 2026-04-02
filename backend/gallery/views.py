import mimetypes
import os

from django.http import FileResponse, HttpResponse, StreamingHttpResponse
from rest_framework import mixins, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Pictures, Videos, YoutubeVideos
from .serializers import PicturesSerializer, VideosSerializer, YoutubeVideosSerializer


class GalleryViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = Pictures.objects.prefetch_related("pictures_translations__language")
    serializer_class = PicturesSerializer

    @action(detail=False, methods=["get"], permission_classes=[permissions.AllowAny])
    def videos(self, request):
        queryset = Videos.objects.prefetch_related("videos_translations__language")
        serializer = VideosSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"], permission_classes=[permissions.AllowAny])
    def youtube(self, request):
        queryset = YoutubeVideos.objects.prefetch_related("youtubevideos_translations__language")
        serializer = YoutubeVideosSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["get"], permission_classes=[permissions.AllowAny], url_path="stream")
    def stream_video(self, request, pk=None):
        video_obj = Videos.objects.filter(pk=pk).first()
        if video_obj is None or not video_obj.video:
            return HttpResponse(status=404)

        file_path = video_obj.video.path
        if not os.path.exists(file_path):
            return HttpResponse(status=404)

        content_type, _encoding = mimetypes.guess_type(file_path)
        content_type = content_type or "application/octet-stream"
        file_size = os.path.getsize(file_path)
        range_header = request.headers.get("Range") or request.META.get("HTTP_RANGE")

        if not range_header:
            response = FileResponse(open(file_path, "rb"), content_type=content_type)
            response["Accept-Ranges"] = "bytes"
            response["Content-Length"] = str(file_size)
            return response

        try:
            unit, ranges = range_header.split("=", 1)
            if unit.strip().lower() != "bytes":
                raise ValueError("unsupported range unit")
            start_raw, end_raw = ranges.split("-", 1)
            start = int(start_raw) if start_raw else 0
            end = int(end_raw) if end_raw else file_size - 1
        except Exception:
            response = HttpResponse(status=416)
            response["Content-Range"] = f"bytes */{file_size}"
            return response

        if start >= file_size or end < start:
            response = HttpResponse(status=416)
            response["Content-Range"] = f"bytes */{file_size}"
            return response

        end = min(end, file_size - 1)
        chunk_size = 8192
        length = end - start + 1

        def file_iterator(path, start_pos, end_pos):
            remaining = end_pos - start_pos + 1
            with open(path, "rb") as file_handle:
                file_handle.seek(start_pos)
                while remaining > 0:
                    read_size = min(chunk_size, remaining)
                    data = file_handle.read(read_size)
                    if not data:
                        break
                    remaining -= len(data)
                    yield data

        response = StreamingHttpResponse(file_iterator(file_path, start, end), status=206, content_type=content_type)
        response["Accept-Ranges"] = "bytes"
        response["Content-Length"] = str(length)
        response["Content-Range"] = f"bytes {start}-{end}/{file_size}"
        return response
