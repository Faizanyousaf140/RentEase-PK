from django.db import models

from users.models import User
from properties.models import Property


class Agreement(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    landlord = models.ForeignKey(User, on_delete=models.CASCADE, related_name="landlord")
    tenant = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tenant")
    rent = models.IntegerField()
    start_date = models.DateField()
    end_date = models.DateField()
