from django.db.models import Q

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Notice
from .serializers import NoticeSerializer


class NoticeViewSet(viewsets.ModelViewSet):
    serializer_class = NoticeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notice.objects.filter(
            Q(agreement__landlord=self.request.user) | Q(agreement__tenant=self.request.user)
        )
