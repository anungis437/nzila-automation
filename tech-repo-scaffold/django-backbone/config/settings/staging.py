"""Staging settings."""
from .base import *  # noqa: F401, F403
import os

DEBUG = False
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "").split(",")
CORS_ALLOWED_ORIGINS = os.environ.get("CORS_ORIGINS", "").split(",")

# Security
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 3600
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
