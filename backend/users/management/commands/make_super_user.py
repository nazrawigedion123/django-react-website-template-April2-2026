from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Makes a user with the given phone number a superuser"

    def add_arguments(self, parser):
        parser.add_argument(
            "email", type=str, help="The email of the user"
        )

    def handle(self, *args, **options):
        email = options["email"]
        User = get_user_model()
        try:
            user = User.objects.get(email=email)
            user.is_superuser = True
            user.is_staff = True
            user.save(update_fields=["is_superuser", "is_staff"])
            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully made user with email {email} a superuser"
                )
            )
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(
                    f"User with email {email} does not exist"
                )
            )
