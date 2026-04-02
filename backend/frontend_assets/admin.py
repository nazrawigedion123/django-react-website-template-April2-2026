from django.contrib import admin

from .models import (
    FrequentlyAskedQuestions,
    FrequentlyAskedQuestionsTranslation,
    HeroSection,
    LogoSection,
    Partners,
    PartnersTranslation,
    Socials,
)

admin.site.register(Socials)
admin.site.register(Partners)
admin.site.register(PartnersTranslation)
admin.site.register(HeroSection)
admin.site.register(LogoSection)
admin.site.register(FrequentlyAskedQuestions)
admin.site.register(FrequentlyAskedQuestionsTranslation)
