
# backend/languages/models.py
from django.db import models, transaction


class Language(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=3, unique=True)
    default = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.default:
            # We use transaction.atomic to ensure both updates happen together
            with transaction.atomic():
                # Set all other languages to False
                Language.objects.filter(default=True).update(default=False)
                super().save(*args, **kwargs)
        else:
            # Logic check: If this is the only language, it MUST be default
            if not Language.objects.exists():
                self.default = True
            super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.code}) {'[DEFAULT]' if self.default else ''}"


class FrontendTranslation(models.Model):
    language = models.ForeignKey(
        Language,
        on_delete=models.CASCADE,
        related_name="frontend_translations",
    )
    page = models.CharField(max_length=100)
    key = models.CharField(max_length=255)
    value = models.TextField()

    class Meta:
        unique_together = ("language", "page", "key")

    def __str__(self):
        return f"[{self.language.code}] {self.page}.{self.key}"