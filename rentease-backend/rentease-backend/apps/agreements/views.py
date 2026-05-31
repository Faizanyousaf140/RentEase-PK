from rest_framework import viewsets

from .models import Agreement
from .serializers import AgreementSerializer


class AgreementViewSet(viewsets.ModelViewSet):
    queryset = Agreement.objects.select_related("property").all().order_by("-id")
    serializer_class = AgreementSerializer
