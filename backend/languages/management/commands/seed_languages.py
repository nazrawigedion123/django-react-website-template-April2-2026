from django.core.management.base import BaseCommand
from languages.models import Language


class Command(BaseCommand):
    help = "Seeds English into the Language table"

    def handle(self, *args, **options):
        languages_to_seed = [
            {"name": "English", "code": "en", "default": True},
            {"name": "Amharic", "code": "am", "default": False},
        ]

        for lang_data in languages_to_seed:
            lang, created = Language.objects.update_or_create(
                code=lang_data["code"],
                defaults={"name": lang_data["name"], "default": lang_data["default"]},
            )

            if created:
                self.stdout.write(
                    self.style.SUCCESS(f"Successfully created: {lang.name}")
                )
            else:
                self.stdout.write(self.style.WARNING(f"Updated existing: {lang.name}"))

        self.stdout.write(self.style.SUCCESS("Language seeding complete!"))
