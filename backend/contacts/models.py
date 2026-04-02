# backend/contacts/models.py
from django.db import models

# Create your models here.

class Contact(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    message = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # This is the modern way to handle multi-field uniqueness
        constraints = [
            models.UniqueConstraint(
                fields=['name', 'email', 'message'], 
                name='unique_contact_submission'
            )
        ]

    def __str__(self):
        return f"{self.name} - {self.ip_address}"

class Subscriber(models.Model):
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return self.email
