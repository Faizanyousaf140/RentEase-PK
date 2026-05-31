from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from agreements.views import AgreementViewSet
from notices.views import NoticeViewSet
from payments.views import PaymentViewSet
from properties.views import PropertyViewSet
from users.serializers import CustomTokenObtainPairSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
	serializer_class = CustomTokenObtainPairSerializer

router = DefaultRouter()
router.register("properties", PropertyViewSet, basename="property")
router.register("agreements", AgreementViewSet, basename="agreement")
router.register("payments", PaymentViewSet, basename="payment")
router.register("notices", NoticeViewSet, basename="notice")

urlpatterns = [
	path("admin/", admin.site.urls),
	path("auth/", include("users.urls")),
	path("", include(router.urls)),
	path("auth/login/", CustomTokenObtainPairView.as_view()),
	path("auth/refresh/", TokenRefreshView.as_view()),
]
