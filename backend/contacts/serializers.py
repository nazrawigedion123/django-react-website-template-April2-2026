from rest_framework import serializers

from .models import Contact, Subscriber


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ["id", "name", "email", "message", "ip_address", "created_at", "updated_at"]
        read_only_fields = ["id", "ip_address", "created_at", "updated_at"]


class SubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscriber
        fields = ["id", "email", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
