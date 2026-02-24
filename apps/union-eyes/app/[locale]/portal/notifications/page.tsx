/**
 * Portal Notifications Page
 *
 * Member-facing notification centre.  Fetches real notifications from the
 * `/api/v2/notifications` backend (Django proxy) and supports:
 *   - All / Unread tab filtering
 *   - Mark-as-read (single & bulk)
 *   - Delete
 *   - Priority badges
 *   - Live unread count
 */
"use client";

export const dynamic = "force-dynamic";

import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertCircle,
  Info,
  MessageSquare,
  FileText,
  Vote,
  BookOpen,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: "low" | "normal" | "high" | "urgent";
  actionUrl?: string;
  actionLabel?: string;
}

type PriorityVariant = "destructive" | "default" | "secondary" | "outline";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getNotificationIcon(type: string) {
  switch (type) {
    case "announcement":
    case "system":
      return <AlertCircle className="h-5 w-5" />;
    case "claim":
    case "claim_update":
    case "case_update":
      return <FileText className="h-5 w-5" />;
    case "document":
    case "document_update":
      return <FileText className="h-5 w-5" />;
    case "training":
      return <BookOpen className="h-5 w-5" />;
    case "voting":
    case "vote":
      return <Vote className="h-5 w-5" />;
    case "message":
      return <MessageSquare className="h-5 w-5" />;
    default:
      return <Info className="h-5 w-5" />;
  }
}

function getPriorityVariant(priority: string): PriorityVariant {
  switch (priority) {
    case "urgent":
      return "destructive";
    case "high":
      return "default";
    case "normal":
      return "secondary";
    default:
      return "outline";
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PortalNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---------- data fetching ---------------------------------------- */

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/v2/notifications");
      if (!res.ok) throw new Error(`Failed to load notifications (${res.status})`);
      const data = await res.json();
      // The API may return { results: [...] } or just an array
      const items: Notification[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data?.data)
            ? data.data
            : [];
      setNotifications(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items.map((n: any) => ({
          id: String(n.id ?? ""),
          type: String(n.type ?? "info"),
          title: String(n.title ?? n.subject ?? ""),
          message: String(n.message ?? n.body ?? ""),
          timestamp: String(n.timestamp ?? n.created_at ?? n.createdAt ?? new Date().toISOString()),
          read: Boolean(n.read ?? n.is_read ?? false),
          priority: (n.priority as Notification["priority"]) ?? "normal",
          actionUrl: n.action_url ?? n.actionUrl,
          actionLabel: n.action_label ?? n.actionLabel,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  /* ---------- actions ---------------------------------------------- */

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    try {
      await fetch(`/api/v2/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n)),
      );
    }
  };

  const markAllAsRead = async () => {
    const previousState = [...notifications];
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch("/api/v2/notifications/mark-all-read", { method: "POST" });
    } catch {
      setNotifications(previousState);
    }
  };

  const deleteNotification = async (id: string) => {
    const previousState = [...notifications];
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(`/api/v2/notifications/${id}`, { method: "DELETE" });
    } catch {
      setNotifications(previousState);
    }
  };

  /* ---------- derived state ---------------------------------------- */

  const unreadCount = notifications.filter((n) => !n.read).length;

  /* ---------- render ----------------------------------------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <p className="text-gray-600">{error}</p>
          <Button variant="outline" onClick={fetchNotifications}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const renderNotification = (notification: Notification) => (
    <Card
      key={notification.id}
      className={notification.read ? "opacity-60" : ""}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="shrink-0 mt-1">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  {notification.title}
                  {!notification.read && (
                    <Badge variant="default" className="text-xs">
                      NEW
                    </Badge>
                  )}
                  <Badge variant={getPriorityVariant(notification.priority)}>
                    {notification.priority}
                  </Badge>
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {notification.message}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(notification.timestamp), {
                      addSuffix: true,
                    })}
                  </span>
                  {notification.actionUrl && (
                    <a
                      href={notification.actionUrl}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {notification.actionLabel || "View Details"}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAsRead(notification.id)}
                title="Mark as read"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteNotification(notification.id)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {unreadCount}
              </Badge>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Stay updated with important announcements and activities
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchNotifications}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 font-medium">No notifications yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    You&apos;ll see claim updates, dues reminders, and union announcements here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              notifications.map(renderNotification)
            )}
          </div>
        </TabsContent>

        <TabsContent value="unread">
          <div className="space-y-2">
            {unreadCount === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 font-medium">All caught up</p>
                  <p className="text-sm text-gray-400 mt-1">
                    No unread notifications.
                  </p>
                </CardContent>
              </Card>
            ) : (
              notifications.filter((n) => !n.read).map(renderNotification)
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
