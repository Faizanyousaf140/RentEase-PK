from datetime import date

from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Agreement
from .serializers import AgreementSerializer

class AgreementViewSet(viewsets.ModelViewSet):
    serializer_class = AgreementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Agreement.objects.select_related("property", "landlord", "tenant").filter(
            Q(landlord=self.request.user) | Q(tenant=self.request.user)
        ).order_by("-created_at")

    def perform_create(self, serializer):
        user = self.request.user
        property_obj = serializer.validated_data.get("property")
        start_date = serializer.validated_data.get("start_date")
        end_date = serializer.validated_data.get("end_date")

        if property_obj is None:
            raise ValidationError({"property": "This field is required."})

        if start_date and end_date and start_date > end_date:
            raise ValidationError({"end_date": "End date must be after start date."})

        overlapping = Agreement.objects.filter(
            property=property_obj,
            status__in=["pending", "active"],
            start_date__lte=end_date,
            end_date__gte=start_date,
        )

        if user.role == "tenant":
            if property_obj.is_occupied:
                raise PermissionDenied("Property is already occupied.")
            if overlapping.exists():
                raise ValidationError({"property": "A pending or active agreement already exists for these dates."})

            serializer.save(
                tenant=user,
                landlord=property_obj.owner,
                rent=serializer.validated_data.get("proposed_rent") or property_obj.rent_amount,
                status="pending",
            )
            return

        tenant = serializer.validated_data.get("tenant")
        if tenant is None:
            raise ValidationError({"tenant": "This field is required for landlords."})
        if property_obj.owner_id != user.id:
            raise PermissionDenied("You can only create agreements for your own properties.")
        if overlapping.exists():
            raise ValidationError({"property": "A pending or active agreement already exists for these dates."})

        agreement = serializer.save(
            landlord=user,
            tenant=tenant,
            rent=serializer.validated_data.get("rent", property_obj.rent_amount),
            proposed_rent=serializer.validated_data.get("proposed_rent"),
            status="active",
        )
        agreement.property.is_occupied = True
        agreement.property.save(update_fields=["is_occupied"])

    def _assert_landlord_owner(self, agreement):
        if self.request.user.role != "landlord" or agreement.landlord_id != self.request.user.id:
            raise PermissionDenied("Only the landlord can review this request.")

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        agreement = self.get_object()
        self._assert_landlord_owner(agreement)

        if agreement.status != "pending":
            raise ValidationError({"status": "Only pending requests can be approved."})

        if agreement.property.is_occupied and agreement.status != "active":
            raise ValidationError({"property": "Property is already occupied."})

        if agreement.proposed_rent is not None:
            agreement.rent = agreement.proposed_rent
        agreement.status = "active"
        agreement.save(update_fields=["status", "rent"])
        if not agreement.property.is_occupied:
            agreement.property.is_occupied = True
            agreement.property.save(update_fields=["is_occupied"])

        return Response(self.get_serializer(agreement).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        agreement = self.get_object()
        self._assert_landlord_owner(agreement)

        if agreement.status != "pending":
            raise ValidationError({"status": "Only pending requests can be rejected."})

        agreement.status = "rejected"
        agreement.save(update_fields=["status"])
        return Response(self.get_serializer(agreement).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def negotiate(self, request, pk=None):
        agreement = self.get_object()

        if request.user.role != "tenant" or agreement.tenant_id != request.user.id:
            raise PermissionDenied("Only the tenant can negotiate this request.")

        if agreement.status not in ["pending", "rejected"]:
            raise ValidationError({"status": "Only pending or rejected requests can be negotiated."})

        proposed_rent = request.data.get("proposed_rent")
        advance_amount = request.data.get("advance_amount", agreement.advance_amount)

        if proposed_rent in (None, ""):
            raise ValidationError({"proposed_rent": "This field is required."})

        agreement.proposed_rent = proposed_rent
        agreement.advance_amount = advance_amount or 0
        agreement.tenant_message = request.data.get("tenant_message", agreement.tenant_message)
        agreement.status = "pending"
        agreement.save(update_fields=["proposed_rent", "advance_amount", "tenant_message", "status"])

        return Response(self.get_serializer(agreement).data, status=status.HTTP_200_OK)