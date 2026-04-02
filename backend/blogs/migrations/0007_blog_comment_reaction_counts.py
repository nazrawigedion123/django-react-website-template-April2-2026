from django.db import migrations, models
from django.db.models import Count


def backfill_blog_counters(apps, schema_editor):
    Blog = apps.get_model("blogs", "Blog")
    BlogComment = apps.get_model("blogs", "BlogComment")
    Reaction = apps.get_model("blogs", "Reaction")

    comment_totals = dict(
        BlogComment.objects.values_list("blog_id").annotate(total=Count("id"))
    )
    reaction_totals = dict(
        Reaction.objects.values_list("blog_id").annotate(total=Count("id"))
    )

    for blog in Blog.objects.only("id"):
        blog.comment_count = comment_totals.get(blog.id, 0)
        blog.reaction_count = reaction_totals.get(blog.id, 0)
        blog.save(update_fields=["comment_count", "reaction_count"])


class Migration(migrations.Migration):

    dependencies = [
        ("blogs", "0006_remove_blog_likes_reaction"),
    ]

    operations = [
        migrations.AddField(
            model_name="blog",
            name="comment_count",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="blog",
            name="reaction_count",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.RunPython(backfill_blog_counters, migrations.RunPython.noop),
    ]
