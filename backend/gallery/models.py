# backend/gallery/models.py
from django.db import models




class Pictures(models.Model):
    image = models.ImageField(upload_to='pictures/')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def get_translation(self, lang_code=None):
        from languages.models import Language

        translations = getattr(self, "pictures_translations", None)
        if translations is not None:
            if lang_code:
                match = next(
                    (t for t in translations.all() if t.language.code == lang_code),
                    None,
                )
                if match:
                    return match
            default_lang = Language.objects.filter(default=True).only("id").first()
            if default_lang:
                return next(
                    (t for t in translations.all() if t.language_id == default_lang.id),
                    None,
                )
            return translations.first()

        if lang_code:
            translation = self.pictures_translations.filter(language__code=lang_code).first()
            if translation:
                return translation
        default_lang = Language.objects.filter(default=True).first()
        if default_lang:
            return self.pictures_translations.filter(language=default_lang).first()
        return self.pictures_translations.first()
    def get_title(self):
        return self.get_translation().title
    def get_description(self):
        return self.get_translation().description
    def __str__(self):
        return self.image.name
class PicturesTranslation(models.Model):
    picture = models.ForeignKey(Pictures, on_delete=models.CASCADE, related_name='pictures_translations')
    language = models.ForeignKey('languages.Language', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField()
    def __str__(self):
        return f"{self.picture.get_title()} ({self.language.code})"

class Videos(models.Model):
    video = models.FileField(upload_to='videos/')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def get_translation(self, lang_code=None):
        from languages.models import Language

        translations = getattr(self, "videos_translations", None)
        if translations is not None:
            if lang_code:
                match = next(
                    (t for t in translations.all() if t.language.code == lang_code),
                    None,
                )
                if match:
                    return match
            default_lang = Language.objects.filter(default=True).only("id").first()
            if default_lang:
                return next(
                    (t for t in translations.all() if t.language_id == default_lang.id),
                    None,
                )
            return translations.first()

        if lang_code:
            translation = self.videos_translations.filter(language__code=lang_code).first()
            if translation:
                return translation
        default_lang = Language.objects.filter(default=True).first()
        if default_lang:
            return self.videos_translations.filter(language=default_lang).first()
        return self.videos_translations.first()
    def get_title(self):
        return self.get_translation().title
    def get_description(self):
        return self.get_translation().description   
    def __str__(self):
        return self.video.name
class VideosTranslation(models.Model):
    video = models.ForeignKey(Videos, on_delete=models.CASCADE, related_name='videos_translations')
    language = models.ForeignKey('languages.Language', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField()
    def __str__(self):
        return f"{self.video.get_title()} ({self.language.code})"



class YoutubeVideos(models.Model):
    video = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def get_translation(self, lang_code=None):
        from languages.models import Language

        translations = getattr(self, "youtubevideos_translations", None)
        if translations is not None:
            if lang_code:
                match = next(
                    (t for t in translations.all() if t.language.code == lang_code),
                    None,
                )
                if match:
                    return match
            default_lang = Language.objects.filter(default=True).only("id").first()
            if default_lang:
                return next(
                    (t for t in translations.all() if t.language_id == default_lang.id),
                    None,
                )
            return translations.first()

        if lang_code:
            translation = self.youtubevideos_translations.filter(language__code=lang_code).first()
            if translation:
                return translation
        default_lang = Language.objects.filter(default=True).first()
        if default_lang:
            return self.youtubevideos_translations.filter(language=default_lang).first()
        return self.youtubevideos_translations.first()
    def get_title(self):
        return self.get_translation().title
    def get_description(self):
        return self.get_translation().description   
    def __str__(self):
        return self.video
class YoutubeVideosTranslation(models.Model):
    youtubevideo = models.ForeignKey(YoutubeVideos, on_delete=models.CASCADE, related_name='youtubevideos_translations')
    language = models.ForeignKey('languages.Language', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField()
    def __str__(self):
        return f"{self.youtubevideo.get_title()} ({self.language.code})"