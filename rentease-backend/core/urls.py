from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from agreements.views import AgreementViewSet
from notices.views import NoticeViewSet
from payments.views import PaymentViewSet
from properties.views import PropertyViewSet

router = DefaultRouter()
router.register("properties", PropertyViewSet)
router.register("agreements", AgreementViewSet)
router.register("payments", PaymentViewSet)
router.register("notices", NoticeViewSet)

urlpatterns = [
	path("admin/", admin.site.urls),
	path("auth/", include("users.urls")),
	path("", include(router.urls)),
	path("auth/login/", TokenObtainPairView.as_view()),
	path("auth/refresh/", TokenRefreshView.as_view()),
]
