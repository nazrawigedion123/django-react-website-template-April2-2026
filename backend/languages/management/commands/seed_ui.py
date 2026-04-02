from django.core.management.base import BaseCommand

from languages.models import FrontendTranslation, Language


EN_TRANSLATIONS = {
    ("nav", "home"): "Home",
    ("nav", "blog"): "Blog",
    ("nav", "gallery"): "Gallery",
    ("nav", "about"): "About",
    ("nav", "dashboard"): "Dashboard",
    ("labels", "welcome"): "Welcome",
    ("theme", "light"): "Light",
    ("theme", "dark"): "Dark",
    ("auth", "login"): "Login",
    ("auth", "logout"): "Logout",
    ("buttons", "save"): "Save",
    ("buttons", "cancel"): "Cancel",
    ("buttons", "create_blog"): "Create Blog",
    ("buttons", "upload_media"): "Upload Media",
    ("buttons", "edit"): "Edit",
    ("buttons", "delete"): "Delete",
    ("headers", "home_title"): "Church Management System",
    ("headers", "blog_title"): "Latest Articles",
    ("headers", "gallery_title"): "Gallery",
    ("headers", "dashboard_title"): "Church Management Dashboard",
    ("headers", "about_title"): "About",
    ("home", "subtitle"): "Welcome to the church platform. Use Blog, Gallery, and Dashboard to manage content.",
    ("home", "contact_us"): "Contact Us",
    ("home", "subscribe"): "Subscribe",
    ("home", "name"): "Name",
    ("home", "email"): "Email",
    ("home", "message"): "Message",
    ("home", "send_message"): "Send Message",
    ("home", "subscribe_success"): "Subscribed successfully.",
    ("home", "subscribe_failed"): "Failed to subscribe.",
    ("home", "message_sent"): "Message sent.",
    ("home", "message_failed"): "Failed to send message.",
    ("about", "body"): "This system supports church content management with role-based dashboard access and multilingual UI.",
    ("gallery", "pictures"): "Pictures",
    ("gallery", "videos"): "Videos",
    ("gallery", "youtube"): "YouTube",
    ("blog", "comments"): "comments",
    ("blog", "reactions"): "reactions",
    ("blog", "read_more"): "Read more",
    ("dashboard", "overview_subtitle"): "Manage blogs, gallery media, and role-based features from the sidebar.",
    ("common", "loading"): "Loading...",
    ("errors", "blog_load_failed"): "Failed to load blogs.",
    ("errors", "gallery_load_failed"): "Failed to load gallery.",
}


LANGUAGE_OVERRIDES = {
    "am": {
        ("nav", "home"): "መነሻ",
        ("nav", "blog"): "ብሎግ",
        ("nav", "gallery"): "ጋለሪ",
        ("nav", "about"): "ስለ እኛ",
        ("nav", "dashboard"): "ዳሽቦርድ",
        ("labels", "welcome"): "እንኳን ደህና መጡ",
        ("theme", "light"): "ብርሃን",
        ("theme", "dark"): "ጨለማ",
        ("auth", "login"): "ግባ",
        ("auth", "logout"): "ውጣ",
        ("headers", "home_title"): "የቤተ ክርስቲያን አስተዳደር ስርዓት",
        ("headers", "blog_title"): "የቅርብ ጽሑፎች",
        ("headers", "gallery_title"): "ጋለሪ",
        ("headers", "dashboard_title"): "የቤተ ክርስቲያን አስተዳደር ዳሽቦርድ",
        ("headers", "about_title"): "ስለ እኛ",
        ("home", "contact_us"): "ያግኙን",
        ("home", "subscribe"): "ይመዝገቡ",
        ("home", "name"): "ስም",
        ("home", "email"): "ኢሜይል",
        ("home", "message"): "መልእክት",
        ("home", "send_message"): "መልእክት ላክ",
        ("home", "subscribe_success"): "በተሳካ ሁኔታ ተመዝግበዋል።",
        ("home", "subscribe_failed"): "መመዝገብ አልተሳካም።",
        ("home", "message_sent"): "መልእክት ተልኳል።",
        ("home", "message_failed"): "መልእክት መላክ አልተሳካም።",
        ("gallery", "pictures"): "ምስሎች",
        ("gallery", "videos"): "ቪዲዮዎች",
        ("gallery", "youtube"): "ዩቲዩብ",
        ("blog", "comments"): "አስተያየቶች",
        ("blog", "reactions"): "ምላሾች",
        ("blog", "read_more"): "ተጨማሪ ያንብቡ",
        ("common", "loading"): "በመጫን ላይ...",
        ("errors", "blog_load_failed"): "ብሎጎችን መጫን አልተሳካም።",
        ("errors", "gallery_load_failed"): "ጋለሪውን መጫን አልተሳካም።",
    }
}


class Command(BaseCommand):
    help = "Seed frontend UI translation keys for all languages"

    def handle(self, *args, **options):
        languages = Language.objects.all()
        if not languages.exists():
            self.stdout.write(self.style.WARNING("No languages found. Seed languages first."))
            return

        created_count = 0
        updated_count = 0

        for language in languages:
            values = dict(EN_TRANSLATIONS)
            values.update(LANGUAGE_OVERRIDES.get(language.code, {}))

            for (page, key), value in values.items():
                _, created = FrontendTranslation.objects.update_or_create(
                    language=language,
                    page=page,
                    key=key,
                    defaults={"value": value},
                )
                if created:
                    created_count += 1
                else:
                    updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Frontend translation seed complete. Created {created_count}, updated {updated_count}."
            )
        )
