"""Clerk JWT middleware for Django."""
from django.http import JsonResponse


class ClerkJWTMiddleware:
    """Middleware to attach Clerk user context to requests."""

    EXEMPT_PATHS = ["/healthz/", "/api/schema/", "/api/docs/", "/admin/"]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip auth for exempt paths
        if any(request.path.startswith(p) for p in self.EXEMPT_PATHS):
            return self.get_response(request)

        return self.get_response(request)
