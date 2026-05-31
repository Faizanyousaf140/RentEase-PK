from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["username"] = user.username
        token["user_id"] = user.id
        return token


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "password", "role", "first_name", "last_name", "full_name"]
        extra_kwargs = {"password": {"write_only": True}}

    def get_full_name(self, obj):
        full_name = obj.get_full_name().strip()
        return full_name or obj.username

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
