from django.db import models
from users.models import User
from properties.models import Property

class Agreement(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("active", "Active"),
        ("rejected", "Rejected"),
        ("expired", "Expired"),
        ("terminated", "Terminated"),
    )
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    landlord = models.ForeignKey(User, on_delete=models.CASCADE, related_name="landlord_agreements")
    tenant = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tenant_agreements")
    rent = models.IntegerField()
    proposed_rent = models.IntegerField(null=True, blank=True)
    advance_amount = models.IntegerField(default=0)
    start_date = models.DateField()
    end_date = models.DateField()
    tenant_message = models.TextField(blank=True, default="")
    landlord_message = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.property} - {self.tenant}"