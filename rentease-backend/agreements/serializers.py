from rest_framework import serializers

from .models import Agreement


class AgreementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agreement
        fields = "__all__"
        read_only_fields = ["landlord"]
        extra_kwargs = {
            "tenant": {"required": False},
            "rent": {"required": False},
            "proposed_rent": {"required": False},
            "advance_amount": {"required": False},
            "tenant_message": {"required": False},
            "landlord_message": {"required": False},
            "status": {"required": False},
        }

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({"end_date": "End date must be after start date."})

        if getattr(user, "role", None) == "landlord":
            if attrs.get("tenant") is None:
                raise serializers.ValidationError({"tenant": "This field is required."})
            if attrs.get("rent") in (None, ""):
                raise serializers.ValidationError({"rent": "This field is required."})

        return attrs
