from django.db import models

from agreements.models import Agreement


class Notice(models.Model):
    NOTICE_TYPES = (
        ("eviction", "Eviction"),
        ("maintenance", "Maintenance"),
    )

    agreement = models.ForeignKey(Agreement, on_delete=models.CASCADE)
    type = models.CharField(max_length=20, choices=NOTICE_TYPES)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.type} notice"
