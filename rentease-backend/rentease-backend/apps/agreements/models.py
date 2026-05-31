from django.db import models

from apps.properties.models import Property


class Agreement(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("active", "Active"),
        ("ended", "Ended"),
    ]

    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="agreements")
    tenant_name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Agreement #{self.id} - {self.tenant_name}"
