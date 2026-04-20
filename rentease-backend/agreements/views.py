from rest_framework import viewsets

from .models import Agreement
from .serializers import AgreementSerializer


class AgreementViewSet(viewsets.ModelViewSet):
    queryset = Agreement.objects.all()
    serializer_class = AgreementSerializer
