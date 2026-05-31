from django.db import models


class Property(models.Model):
    title = models.CharField(max_length=120)
    address = models.TextField()
    landlord_name = models.CharField(max_length=100)
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.title
