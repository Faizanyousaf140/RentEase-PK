from django.db import models

from users.models import User


class Property(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    address = models.TextField()
