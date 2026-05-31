from django.db.models import Q

from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from .models import Payment
from .serializers import PaymentSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(
            Q(agreement__landlord=self.request.user) | Q(agreement__tenant=self.request.user)
        )

    def perform_create(self, serializer):
        agreement = serializer.validated_data["agreement"]
        user = self.request.user

        if user.role == "tenant":
            if agreement.tenant != user:
                raise PermissionDenied("Tenants can only mark their own payments.")
            serializer.save(status="pending")
            return

        if agreement.landlord != user:
            raise PermissionDenied("Landlords can only confirm payments for their agreements.")
        serializer.save()

    def perform_update(self, serializer):
        payment = self.get_object()
        user = self.request.user

        if payment.agreement.landlord != user and payment.agreement.tenant != user:
            raise PermissionDenied("You cannot update this payment.")

        if user.role == "tenant":
            serializer.save(status="pending")
            return

        serializer.save()
