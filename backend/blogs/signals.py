from django.db.models import F, Value
from django.db.models.functions import Greatest
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from .models import Blog, BlogComment, Reaction


def _increment_comment_count(blog_id: int):
    Blog.objects.filter(pk=blog_id).update(comment_count=F("comment_count") + 1)


def _decrement_comment_count(blog_id: int):
    Blog.objects.filter(pk=blog_id).update(
        comment_count=Greatest(F("comment_count") - 1, Value(0))
    )


def _increment_reaction_count(blog_id: int):
    Blog.objects.filter(pk=blog_id).update(reaction_count=F("reaction_count") + 1)


def _decrement_reaction_count(blog_id: int):
    Blog.objects.filter(pk=blog_id).update(
        reaction_count=Greatest(F("reaction_count") - 1, Value(0))
    )


@receiver(pre_save, sender=BlogComment)
def cache_old_comment_blog(sender, instance: BlogComment, **kwargs):
    if not instance.pk:
        instance._old_blog_id = None
        return
    old_blog_id = sender.objects.filter(pk=instance.pk).values_list("blog_id", flat=True).first()
    instance._old_blog_id = old_blog_id


@receiver(post_save, sender=BlogComment)
def update_comment_count_on_save(sender, instance: BlogComment, created: bool, **kwargs):
    if created:
        _increment_comment_count(instance.blog_id)
        return

    old_blog_id = getattr(instance, "_old_blog_id", None)
    if old_blog_id and old_blog_id != instance.blog_id:
        _decrement_comment_count(old_blog_id)
        _increment_comment_count(instance.blog_id)


@receiver(post_delete, sender=BlogComment)
def update_comment_count_on_delete(sender, instance: BlogComment, **kwargs):
    _decrement_comment_count(instance.blog_id)


@receiver(pre_save, sender=Reaction)
def cache_old_reaction_blog(sender, instance: Reaction, **kwargs):
    if not instance.pk:
        instance._old_blog_id = None
        return
    old_blog_id = sender.objects.filter(pk=instance.pk).values_list("blog_id", flat=True).first()
    instance._old_blog_id = old_blog_id


@receiver(post_save, sender=Reaction)
def update_reaction_count_on_save(sender, instance: Reaction, created: bool, **kwargs):
    if created:
        _increment_reaction_count(instance.blog_id)
        return

    old_blog_id = getattr(instance, "_old_blog_id", None)
    if old_blog_id and old_blog_id != instance.blog_id:
        _decrement_reaction_count(old_blog_id)
        _increment_reaction_count(instance.blog_id)


@receiver(post_delete, sender=Reaction)
def update_reaction_count_on_delete(sender, instance: Reaction, **kwargs):
    _decrement_reaction_count(instance.blog_id)
