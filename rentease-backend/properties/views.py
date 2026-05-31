from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied

from .models import Property
from .serializers import PropertySerializer


class PropertyViewSet(viewsets.ModelViewSet):
    serializer_class = PropertySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "landlord":
            return Property.objects.filter(owner=user)
        return Property.objects.filter(is_occupied=False)

    def perform_create(self, serializer):
        if self.request.user.role != "landlord":
            raise PermissionDenied("Only landlords can add properties.")
        serializer.save(owner=self.request.user)
