from django.db import models


class User(models.Model):
    ROLE_CHOICES = [
        ("tenant", "Tenant"),
        ("landlord", "Landlord"),
        ("admin", "Admin"),
    ]

    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="tenant")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.name} ({self.role})"
