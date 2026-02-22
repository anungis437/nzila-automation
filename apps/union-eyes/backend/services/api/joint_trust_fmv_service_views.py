"""
JointTrustFmvServiceViewSet
Generated from service: joint-trust-fmv-service
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
from billing.models import FmvPolicy, CpiData, FmvBenchmarks, ProcurementRequests, ProcurementBids, IndependentAppraisals, CpiAdjustedPricing, FmvViolations, FmvAuditLog
from core.models import AuditLogs

class JointTrustFmvServicePagination(CursorPagination):
    page_size = 50
    ordering = '-created_at'
    cursor_query_param = 'cursor'


class JointTrustFmvServiceViewSet(viewsets.ViewSet):
    """
    ViewSet for joint-trust-fmv-service operations.

    Endpoints:
    - GET /api/services/joint-trust-fmv-service/fmv_policy/ — Get FMV policy
- POST /api/services/joint-trust-fmv-service/update_fmv_policy/ — Update FMV policy
- POST /api/services/joint-trust-fmv-service/calculate_fmv/ — Calculate fair market value
- GET /api/services/joint-trust-fmv-service/procurement_requests/ — List procurement requests
- POST /api/services/joint-trust-fmv-service/create_procurement/ — Create procurement request
- GET /api/services/joint-trust-fmv-service/bids/ — List procurement bids
- POST /api/services/joint-trust-fmv-service/submit_bid/ — Submit procurement bid
- GET /api/services/joint-trust-fmv-service/appraisals/ — List independent appraisals
- POST /api/services/joint-trust-fmv-service/request_appraisal/ — Request independent appraisal
- GET /api/services/joint-trust-fmv-service/cpi_data/ — Get CPI data
- GET /api/services/joint-trust-fmv-service/cpi_adjusted_pricing/ — Get CPI-adjusted pricing
- GET /api/services/joint-trust-fmv-service/benchmarks/ — Get FMV benchmarks
- GET /api/services/joint-trust-fmv-service/violations/ — List FMV violations
- GET /api/services/joint-trust-fmv-service/audit_log/ — Get FMV audit log
    """

    permission_classes = [IsAuthenticated]
    pagination_class = JointTrustFmvServicePagination

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

    @action(detail=False, methods=['get'])
    def fmv_policy(self, request):
        """
        Get FMV policy
        GET /api/services/joint-trust-fmv-service/fmv_policy/
        """
        try:
            queryset = FmvPolicy.objects.filter(
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
                'action': 'fmv_policy',
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def update_fmv_policy(self, request):
        """
        Update FMV policy
        POST /api/services/joint-trust-fmv-service/update_fmv_policy/
        """
        try:
            data = request.data
            with transaction.atomic():
                obj = FmvPolicy.objects.create(
                    organization_id=request.user.organization_id,
                    **{k: v for k, v in data.items() if k != 'organization_id'}
                )
                AuditLogs.objects.create(
                    organization_id=request.user.organization_id,
                    action='update_fmv_policy',
                    resource_type='FmvPolicy',
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
                'action': 'update_fmv_policy',
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def calculate_fmv(self, request):
        """
        Calculate fair market value
        POST /api/services/joint-trust-fmv-service/calculate_fmv/
        """
        try:
            data = request.data
            org_id = request.user.organization_id
            # TODO: Implement business logic
            return Response({
                'status': 'success',
                'message': 'Calculate fair market value',
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': str(e),
                'action': 'calculate_fmv',
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def procurement_requests(self, request):
        """
        List procurement requests
        GET /api/services/joint-trust-fmv-service/procurement_requests/
        """
        try:
            queryset = ProcurementRequests.objects.filter(
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
                'action': 'procurement_requests',
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def create_procurement(self, request):
        """
        Create procurement request
        POST /api/services/joint-trust-fmv-service/create_procurement/
        """
        try:
            data = request.data
            with transaction.atomic():
                obj = ProcurementRequests.objects.create(
                    organization_id=request.user.organization_id,
                    **{k: v for k, v in data.items() if k != 'organization_id'}
                )
                AuditLogs.objects.create(
                    organization_id=request.user.organization_id,
                    action='create_procurement',
                    resource_type='ProcurementRequests',
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
                'action': 'create_procurement',
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def bids(self, request):
        """
        List procurement bids
        GET /api/services/joint-trust-fmv-service/bids/
        """
        try:
            queryset = ProcurementBids.objects.filter(
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
                'action': 'bids',
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def submit_bid(self, request):
        """
        Submit procurement bid
        POST /api/services/joint-trust-fmv-service/submit_bid/
        """
        try:
            data = request.data
            with transaction.atomic():
                obj = ProcurementBids.objects.create(
                    organization_id=request.user.organization_id,
                    **{k: v for k, v in data.items() if k != 'organization_id'}
                )
                AuditLogs.objects.create(
                    organization_id=request.user.organization_id,
                    action='submit_bid',
                    resource_type='ProcurementBids',
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
                'action': 'submit_bid',
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def appraisals(self, request):
        """
        List independent appraisals
        GET /api/services/joint-trust-fmv-service/appraisals/
        """
        try:
            queryset = IndependentAppraisals.objects.filter(
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
                'action': 'appraisals',
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def request_appraisal(self, request):
        """
        Request independent appraisal
        POST /api/services/joint-trust-fmv-service/request_appraisal/
        """
        try:
            data = request.data
            with transaction.atomic():
                obj = IndependentAppraisals.objects.create(
                    organization_id=request.user.organization_id,
                    **{k: v for k, v in data.items() if k != 'organization_id'}
                )
                AuditLogs.objects.create(
                    organization_id=request.user.organization_id,
                    action='request_appraisal',
                    resource_type='IndependentAppraisals',
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
                'action': 'request_appraisal',
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def cpi_data(self, request):
        """
        Get CPI data
        GET /api/services/joint-trust-fmv-service/cpi_data/
        """
        try:
            queryset = CpiData.objects.filter(
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
                'action': 'cpi_data',
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def cpi_adjusted_pricing(self, request):
        """
        Get CPI-adjusted pricing
        GET /api/services/joint-trust-fmv-service/cpi_adjusted_pricing/
        """
        try:
            queryset = CpiAdjustedPricing.objects.filter(
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
                'action': 'cpi_adjusted_pricing',
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def benchmarks(self, request):
        """
        Get FMV benchmarks
        GET /api/services/joint-trust-fmv-service/benchmarks/
        """
        try:
            queryset = FmvBenchmarks.objects.filter(
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
                'action': 'benchmarks',
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def violations(self, request):
        """
        List FMV violations
        GET /api/services/joint-trust-fmv-service/violations/
        """
        try:
            queryset = FmvViolations.objects.filter(
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
                'action': 'violations',
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def audit_log(self, request):
        """
        Get FMV audit log
        GET /api/services/joint-trust-fmv-service/audit_log/
        """
        try:
            queryset = FmvAuditLog.objects.filter(
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
                'action': 'audit_log',
            }, status=status.HTTP_400_BAD_REQUEST)

