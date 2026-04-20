from django.db import models

from agreements.models import Agreement


class Payment(models.Model):
    STATUS_CHOICES = (
        ("paid", "Paid"),
        ("pending", "Pending"),
    )

    agreement = models.ForeignKey(Agreement, on_delete=models.CASCADE)
    amount = models.IntegerField()
    month = models.CharField(max_length=20)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.month} - {self.status}"
