from django.core.exceptions import ValidationError
from django.db import models

class Socials(models.Model):
    name = models.CharField(max_length=100)
    url = models.URLField()
    icon = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Partners(models.Model):
    image = models.ImageField(upload_to='partners/')
    url = models.URLField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_translation(self, lang_code=None):
        from languages.models import Language

        translations = getattr(self, "partners_translations", None)
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
            translation = self.partners_translations.filter(language__code=lang_code).first()
            if translation:
                return translation
        default_lang = Language.objects.filter(default=True).first()
        if default_lang:
            return self.partners_translations.filter(language=default_lang).first()
        return self.partners_translations.first()

    def get_name(self):
        translation = self.get_translation()
        return translation.name if translation else ""

    def get_description(self):
        translation = self.get_translation()
        return translation.description if translation else ""

    def __str__(self):
        return self.get_name() or f"Partner #{self.pk}"


class PartnersTranslation(models.Model):
    partner = models.ForeignKey(Partners, on_delete=models.CASCADE, related_name="partners_translations")
    language = models.ForeignKey("languages.Language", on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    class Meta:
        unique_together = ("partner", "language")

    def __str__(self):
        return f"{self.partner.get_name()} ({self.language.code})"


class HeroSection(models.Model):
    image = models.ImageField(upload_to="hero/")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    active = models.BooleanField(default=False)

    def clean(self):
        if not self.pk and HeroSection.objects.exists():
            raise ValidationError("Only one hero section record is allowed.")

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return self.image.name


class LogoSection(models.Model):
    image = models.ImageField(upload_to="logo/")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    active = models.BooleanField(default=False)

    def clean(self):
        if not self.pk and LogoSection.objects.exists():
            raise ValidationError("Only one logo record is allowed.")

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return self.image.name


class FrequentlyAskedQuestions(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    active = models.BooleanField(default=False)

    def get_translation(self, lang_code=None):
        from languages.models import Language

        translations = getattr(self, "frequently_asked_questions_translations", None)
        if translations is not None:
            if lang_code:
                match = next((t for t in translations.all() if t.language.code == lang_code), None)
                if match:
                    return match
            default_lang = Language.objects.filter(default=True).only("id").first()
            if default_lang:
                return next((t for t in translations.all() if t.language_id == default_lang.id), None)
            return translations.first()
        if lang_code:
            translation = self.frequently_asked_questions_translations.filter(language__code=lang_code).first()
            if translation:
                return translation
        default_lang = Language.objects.filter(default=True).first()
        if default_lang:
            return self.frequently_asked_questions_translations.filter(language=default_lang).first()
        return self.frequently_asked_questions_translations.first()

    def get_question(self):
        translation = self.get_translation()
        return translation.question if translation else ""

    def get_answer(self):
        translation = self.get_translation()
        return translation.answer if translation else ""

    def __str__(self):
        return self.get_question() or f"FAQ #{self.pk}"


class FrequentlyAskedQuestionsTranslation(models.Model):
    frequently_asked_question = models.ForeignKey(
        FrequentlyAskedQuestions,
        on_delete=models.CASCADE,
        related_name="frequently_asked_questions_translations",
    )
    language = models.ForeignKey("languages.Language", on_delete=models.CASCADE)
    question = models.CharField(max_length=200)
    answer = models.TextField(blank=True)

    class Meta:
        unique_together = ("frequently_asked_question", "language")

    def __str__(self):
        return f"{self.frequently_asked_question.get_question()} ({self.language.code})"
