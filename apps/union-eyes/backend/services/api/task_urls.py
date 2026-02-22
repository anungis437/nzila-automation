"""
URL configuration for the Celery task enqueue API.

Mounted at /api/tasks/ in config/urls.py.
Replaces frontend direct BullMQ usage for all background job operations.
"""

from django.urls import path

from .task_enqueue_views import (
    FailedTasksView,
    QueuePauseView,
    QueueResumeView,
    QueueStatsView,
    RetryTaskView,
    TaskEnqueueView,
    TaskStatusView,
)

urlpatterns = [
    # Enqueue a job
    path("enqueue/", TaskEnqueueView.as_view(), name="task-enqueue"),

    # Queue monitoring (admin)
    path("queues/", QueueStatsView.as_view(), name="task-queue-stats"),
    path("queues/<str:queue_name>/failed/", FailedTasksView.as_view(), name="task-queue-failed"),
    path("queues/<str:queue_name>/pause/", QueuePauseView.as_view(), name="task-queue-pause"),
    path("queues/<str:queue_name>/resume/", QueueResumeView.as_view(), name="task-queue-resume"),

    # Individual task management
    path("jobs/<str:task_id>/status/", TaskStatusView.as_view(), name="task-status"),
    path("jobs/<str:task_id>/retry/",  RetryTaskView.as_view(), name="task-retry"),
]
