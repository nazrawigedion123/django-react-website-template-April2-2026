# backend/blogs/models.py
from django.db import models

# Create your models here.

class Blog(models.Model):
    author = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='authored_blogs')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    published_by=models.ForeignKey('users.User', on_delete=models.CASCADE, null=True, blank=True, related_name='published_blogs')
    comment_count = models.PositiveIntegerField(default=0)
    reaction_count = models.PositiveIntegerField(default=0)
  
    def get_translation(self, lang_code=None):
        from languages.models import Language

        translations = getattr(self, "blog_translations", None)
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
            translation = self.blog_translations.filter(language__code=lang_code).first()
            if translation:
                return translation
        default_lang = Language.objects.filter(default=True).first()
        if default_lang:
            return self.blog_translations.filter(language=default_lang).first()
        return self.blog_translations.first()
    
    def __str__(self):
        t = self.get_translation()
        return t.title if t and t.title else "(untitled)"

    def get_content(self, lang_code=None):
        t = self.get_translation(lang_code)
        return t.content if t else ""

    def get_title(self, lang_code=None):
        t = self.get_translation(lang_code)
        return t.title if t and t.title else ""
 
class BlogTranslation(models.Model):
    blog = models.ForeignKey(Blog, on_delete=models.CASCADE, related_name='blog_translations')
    language = models.ForeignKey('languages.Language', on_delete=models.CASCADE)
    title = models.CharField(max_length=200, blank=True, null=True)
    content = models.TextField(blank=True, null=True)

    def __str__(self):
        title = self.title or "(untitled)"
        return f"{title} ({self.language.code})"


class BlogSection(models.Model):
    blog = models.ForeignKey(Blog, on_delete=models.CASCADE, related_name="sections")
    order = models.PositiveIntegerField(default=0)
    image = models.ImageField(upload_to="blogs/sections/", null=True, blank=True)

    class Meta:
        ordering = ["order", "id"]
    def get_translation(self, lang_code=None):
        from languages.models import Language

        translations = getattr(self, "blog_section_translations", None)
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
            translation = self.blog_section_translations.filter(language__code=lang_code).first()
            if translation:
                return translation
        default_lang = Language.objects.filter(default=True).first()
        if default_lang:
            return self.blog_section_translations.filter(language=default_lang).first()
        return self.blog_section_translations.first()

    def __str__(self):
        return f"Section {self.order} for blog {self.blog_id}"
    def get_content(self, lang_code=None):
        t = self.get_translation(lang_code)
        return t.content if t else ""

    def get_title(self, lang_code=None):
        t = self.get_translation(lang_code)
        return t.title if t and t.title else ""
class BlogSectionTranslation(models.Model):
    blog_section = models.ForeignKey(BlogSection, on_delete=models.CASCADE, related_name='blog_section_translations')
    language = models.ForeignKey('languages.Language', on_delete=models.CASCADE)
    title = models.CharField(max_length=200, blank=True, null=True)
    content = models.TextField(blank=True, null=True)

    def __str__(self):
        title = self.title or "(untitled)"
        return f"{title} ({self.language.code})"



class BlogComment(models.Model):
    reply_to = models.ForeignKey('self', on_delete=models.CASCADE, related_name='replies', null=True, blank=True)
    blog = models.ForeignKey(Blog, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Reaction(models.Model):
    # Define your reaction types here
    LIKE = 'like'
    LOVE = 'love'
    HAHA = 'haha'
    WOW = 'wow'
    SAD = 'sad'
    ANGRY = 'angry'

    REACTION_CHOICES = [
        (LIKE, 'Like'),
        (LOVE, 'Love'),
        (HAHA, 'Haha'),
        (WOW, 'Wow'),
        (SAD, 'Sad'),
        (ANGRY, 'Angry'),
    ]

    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='reactions')
    blog = models.ForeignKey('Blog', on_delete=models.CASCADE, related_name='reactions')
    reaction_type = models.CharField(
        max_length=10, 
        choices=REACTION_CHOICES, 
        default=LIKE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Ensures one user can only have one reaction per blog.
        # If they click "Love" after "Like", you'll update the existing record.
        unique_together = ('user', 'blog')

    def __str__(self):
        return f"{self.user.username} reacted {self.reaction_type} to {self.blog.id}"
