"""
TwilioSmsServiceViewSet
Generated from service: twilio-sms-service
Auto-generated: 2026-02-18 09:08
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import CursorPagination
from django.db import transaction
from django.utils import timezone
import uuid
import logging

logger = logging.getLogger(__name__)
from notifications.models import SmsTemplates, SmsCampaigns, SmsMessages, SmsConversations, SmsCampaignRecipients, SmsOptOuts, SmsRateLimits
from core.models import AuditLogs

class TwilioSmsServicePagination(CursorPagination):
    page_size = 50
    ordering = '-created_at'
    cursor_query_param = 'cursor'


class TwilioSmsServiceViewSet(viewsets.ViewSet):
    """
    ViewSet for twilio-sms-service operations.

    Endpoints:
    - POST /api/services/twilio-sms-service/send/ — Send a single SMS
- POST /api/services/twilio-sms-service/send_bulk/ — Send bulk SMS campaign
- GET /api/services/twilio-sms-service/templates/ — List SMS templates
- POST /api/services/twilio-sms-service/create_template/ — Create SMS template
- GET /api/services/twilio-sms-service/opt_outs/ — List SMS opt-outs
- POST /api/services/twilio-sms-service/handle_opt_out/ — Handle opt-out request
- GET /api/services/twilio-sms-service/conversations/ — List SMS conversations
- GET /api/services/twilio-sms-service/message_history/ — Get SMS message history
- POST /api/services/twilio-sms-service/validate_phone/ — Validate phone number format
- GET /api/services/twilio-sms-service/rate_limits/ — Get SMS rate limit status
- POST /api/services/twilio-sms-service/webhook/ — Handle Twilio inbound webhook
- GET /api/services/twilio-sms-service/campaign_status/ — Get campaign delivery status
    """

    permission_classes = [IsAuthenticated]
    pagination_class = TwilioSmsServicePagination

    def paginate_queryset(self, queryset):
        paginator = self.pagination_class()
        return paginator.paginate_queryset(queryset, self.request, view=self)

    def get_paginated_response(self, data):
        paginator = self.pagination_class()
        # Reconstruct paginated response
        return Response({
            'count': len(data),
            'results': data,
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def send(self, request):
        """
        Send a single SMS
        POST /api/services/twilio-sms-service/send/
        """
        try:
            data = request.data
            with transaction.atomic():
                obj = SmsMessages.objects.create(
                    organization_id=request.user.organization_id,
                    **{k: v for k, v in data.items() if k != 'organization_id'}
                )
                AuditLogs.objects.create(
                    organization_id=request.user.organization_id,
                    action='send',
                    resource_type='SmsMessages',
                    resource_id=str(obj.id),
                    user_id=str(request.user.id),
                    details=data,
                )
            return Response({
                'id': str(obj.id),
                'created_at': obj.created_at.isoformat(),
                'status': 'success',
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                'error': str(e),
                'action': 'send',
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def send_bulk(self, request):
        """
        Send bulk SMS campaign
        POST /api/services/twilio-sms-service/send_bulk/
        """
        try:
            data = request.data
            with transaction.atomic():
                obj = SmsCampaigns.objects.create(
                    organization_id=request.user.organization_id,
                    **{k: v for k, v in data.items() if k != 'organization_id'}
                )
                AuditLogs.objects.create(
                    organization_id=request.user.organization_id,
                    action='send_bulk',
                    resource_type='SmsCampaigns',
                    resource_id=str(obj.id),
                    user_id=str(request.user.id),
                    details=data,
                )
            return Response({
                'id': str(obj.id),
                'created_at': obj.created_at.isoformat(),
                'status': 'success',
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                'error': str(e),
                'action': 'send_bulk',
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def templates(self, request):
        """
        List SMS templates
        GET /api/services/twilio-sms-service/templates/
        """
        try:
            queryset = SmsTemplates.objects.filter(
                organization_id=request.user.organization_id
            )
            # Apply filters from query params
            for param in ['status', 'type', 'created_after', 'created_before']:
                val = request.query_params.get(param)
                if val:
                    if param == 'created_after':
                        queryset = queryset.filter(created_at__gte=val)
                    elif param == 'created_before':
                        queryset = queryset.filter(created_at__lte=val)
                    else:
                        queryset = queryset.filter(**{param: val})

            page = self.paginate_queryset(queryset.order_by('-created_at'))
            if page is not None:
                data = list(page.values())
                return self.get_paginated_response(data)

            return Response({
                'count': queryset.count(),
                'results': list(queryset.order_by('-created_at').values()[:100]),
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': str(e),
                'action': 'templates',
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def create_template(self, request):
        """
        Create SMS template
        POST /api/services/twilio-sms-service/create_template/
        """
        try:
            data = request.data
            with transaction.atomic():
                obj = SmsTemplates.objects.create(
                    organization_id=request.user.organization_id,
                    **{k: v for k, v in data.items() if k != 'organization_id'}
                )
                AuditLogs.objects.create(
                    organization_id=request.user.organization_id,
                    action='create_template',
                    resource_type='SmsTemplates',
                    resource_id=str(obj.id),
                    user_id=str(request.user.id),
                    details=data,
                )
            return Response({
                'id': str(obj.id),
                'created_at': obj.created_at.isoformat(),
                'status': 'success',
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                'error': str(e),
                'action': 'create_template',
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def opt_outs(self, request):
        """
        List SMS opt-outs
        GET /api/services/twilio-sms-service/opt_outs/
        """
        try:
            queryset = SmsOptOuts.objects.filter(
                organization_id=request.user.organization_id
            )
            # Apply filters from query params
            for param in ['status', 'type', 'created_after', 'created_before']:
                val = request.query_params.get(param)
                if val:
                    if param == 'created_after':
                        queryset = queryset.filter(created_at__gte=val)
                    elif param == 'created_before':
                        queryset = queryset.filter(created_at__lte=val)
                    else:
                        queryset = queryset.filter(**{param: val})

            page = self.paginate_queryset(queryset.order_by('-created_at'))
            if page is not None:
                data = list(page.values())
                return self.get_paginated_response(data)

            return Response({
                'count': queryset.count(),
                'results': list(queryset.order_by('-created_at').values()[:100]),
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': str(e),
                'action': 'opt_outs',
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def handle_opt_out(self, request):
        """
        Handle opt-out request
        POST /api/services/twilio-sms-service/handle_opt_out/
        """
        try:
            data = request.data
            with transaction.atomic():
                obj = SmsOptOuts.objects.create(
                    organization_id=request.user.organization_id,
                    **{k: v for k, v in data.items() if k != 'organization_id'}
                )
                AuditLogs.objects.create(
                    organization_id=request.user.organization_id,
                    action='handle_opt_out',
                    resource_type='SmsOptOuts',
                    resource_id=str(obj.id),
                    user_id=str(request.user.id),
                    details=data,
                )
            return Response({
                'id': str(obj.id),
                'created_at': obj.created_at.isoformat(),
                'status': 'success',
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                'error': str(e),
                'action': 'handle_opt_out',
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def conversations(self, request):
        """
        List SMS conversations
        GET /api/services/twilio-sms-service/conversations/
        """
        try:
            queryset = SmsConversations.objects.filter(
                organization_id=request.user.organization_id
            )
            # Apply filters from query params
            for param in ['status', 'type', 'created_after', 'created_before']:
                val = request.query_params.get(param)
                if val:
                    if param == 'created_after':
                        queryset = queryset.filter(created_at__gte=val)
                    elif param == 'created_before':
                        queryset = queryset.filter(created_at__lte=val)
                    else:
                        queryset = queryset.filter(**{param: val})

            page = self.paginate_queryset(queryset.order_by('-created_at'))
            if page is not None:
                data = list(page.values())
                return self.get_paginated_response(data)

            return Response({
                'count': queryset.count(),
                'results': list(queryset.order_by('-created_at').values()[:100]),
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': str(e),
                'action': 'conversations',
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def message_history(self, request):
        """
        Get SMS message history
        GET /api/services/twilio-sms-service/message_history/
        """
        try:
            queryset = SmsMessages.objects.filter(
                organization_id=request.user.organization_id
            )
            # Apply filters from query params
            for param in ['status', 'type', 'created_after', 'created_before']:
                val = request.query_params.get(param)
                if val:
                    if param == 'created_after':
                        queryset = queryset.filter(created_at__gte=val)
                    elif param == 'created_before':
                        queryset = queryset.filter(created_at__lte=val)
                    else:
                        queryset = queryset.filter(**{param: val})

            page = self.paginate_queryset(queryset.order_by('-created_at'))
            if page is not None:
                data = list(page.values())
                return self.get_paginated_response(data)

            return Response({
                'count': queryset.count(),
                'results': list(queryset.order_by('-created_at').values()[:100]),
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': str(e),
                'action': 'message_history',
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def validate_phone(self, request):
        """
        Validate phone number format
        POST /api/services/twilio-sms-service/validate_phone/
        """
        try:
            data = request.data
            org_id = request.user.organization_id
            # TODO: Implement business logic
            return Response({
                'status': 'success',
                'message': 'Validate phone number format',
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': str(e),
                'action': 'validate_phone',
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def rate_limits(self, request):
        """
        Get SMS rate limit status
        GET /api/services/twilio-sms-service/rate_limits/
        """
        try:
            queryset = SmsRateLimits.objects.filter(
                organization_id=request.user.organization_id
            )
            # Apply filters from query params
            for param in ['status', 'type', 'created_after', 'created_before']:
                val = request.query_params.get(param)
                if val:
                    if param == 'created_after':
                        queryset = queryset.filter(created_at__gte=val)
                    elif param == 'created_before':
                        queryset = queryset.filter(created_at__lte=val)
                    else:
                        queryset = queryset.filter(**{param: val})

            page = self.paginate_queryset(queryset.order_by('-created_at'))
            if page is not None:
                data = list(page.values())
                return self.get_paginated_response(data)

            return Response({
                'count': queryset.count(),
                'results': list(queryset.order_by('-created_at').values()[:100]),
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': str(e),
                'action': 'rate_limits',
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def webhook(self, request):
        """
        Handle Twilio inbound webhook
        POST /api/services/twilio-sms-service/webhook/
        """
        try:
            data = request.data
            org_id = request.user.organization_id
            # TODO: Implement business logic
            return Response({
                'status': 'success',
                'message': 'Handle Twilio inbound webhook',
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': str(e),
                'action': 'webhook',
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def campaign_status(self, request):
        """
        Get campaign delivery status
        GET /api/services/twilio-sms-service/campaign_status/
        """
        try:
            queryset = SmsCampaigns.objects.filter(
                organization_id=request.user.organization_id
            )
            # Apply filters from query params
            for param in ['status', 'type', 'created_after', 'created_before']:
                val = request.query_params.get(param)
                if val:
                    if param == 'created_after':
                        queryset = queryset.filter(created_at__gte=val)
                    elif param == 'created_before':
                        queryset = queryset.filter(created_at__lte=val)
                    else:
                        queryset = queryset.filter(**{param: val})

            page = self.paginate_queryset(queryset.order_by('-created_at'))
            if page is not None:
                data = list(page.values())
                return self.get_paginated_response(data)

            return Response({
                'count': queryset.count(),
                'results': list(queryset.order_by('-created_at').values()[:100]),
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': str(e),
                'action': 'campaign_status',
            }, status=status.HTTP_400_BAD_REQUEST)

