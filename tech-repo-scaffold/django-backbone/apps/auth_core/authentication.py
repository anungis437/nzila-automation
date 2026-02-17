"""Clerk JWT authentication backend for Django REST Framework."""
import jwt
import requests
from django.conf import settings
from rest_framework import authentication, exceptions


class ClerkAuthentication(authentication.BaseAuthentication):
    """Authenticates requests using Clerk JWT tokens."""

    def authenticate(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            return None

        token = auth_header[7:]
        try:
            # Fetch JWKS from Clerk
            jwks_url = settings.CLERK_JWKS_URL
            jwks_client = jwt.PyJWKClient(jwks_url)
            signing_key = jwks_client.get_signing_key_from_jwt(token)

            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                options={"verify_aud": False},
            )

            user = self._get_or_create_user(payload)
            return (user, payload)

        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed("Token expired")
        except jwt.InvalidTokenError as e:
            raise exceptions.AuthenticationFailed(f"Invalid token: {e}")

    def _get_or_create_user(self, payload):
        """Get or create Django user from Clerk JWT payload."""
        from django.contrib.auth import get_user_model
        User = get_user_model()

        clerk_user_id = payload.get("sub", "")
        email = payload.get("email", "")

        user, _ = User.objects.get_or_create(
            username=clerk_user_id,
            defaults={"email": email, "is_active": True},
        )
        return user
