/**
 * Admin Settings Page
 *
 * System-wide configuration for the UnionEyes platform.
 * Covers feature flags, email/notification defaults, security policies,
 * and integration endpoints.
 */

export const dynamic = "force-dynamic";

import {
  Settings,
  Shield,
  Bell,
  Globe,
  Key,
  Server,
  ToggleLeft,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: { locale: string };
}

/* ── Placeholder settings (will be read from DB / env in a future sprint) ── */
const SYSTEM_SETTINGS = [
  {
    section: "Security",
    icon: Shield,
    description: "Authentication, session, and access-control policies",
    items: [
      { label: "Session timeout", value: "30 minutes", status: "active" },
      { label: "MFA enforcement", value: "Required for admins", status: "active" },
      { label: "Password policy", value: "12+ chars, mixed case, symbol", status: "active" },
      { label: "API rate limiting", value: "100 req/min per user", status: "active" },
    ],
  },
  {
    section: "Notifications",
    icon: Bell,
    description: "Default notification channels and digest frequency",
    items: [
      { label: "Email digest", value: "Daily", status: "active" },
      { label: "Push notifications", value: "Enabled", status: "active" },
      { label: "SMS alerts", value: "Critical only", status: "warning" },
      { label: "Webhook notifications", value: "Disabled", status: "inactive" },
    ],
  },
  {
    section: "Integrations",
    icon: Server,
    description: "Third-party service connections and API keys",
    items: [
      { label: "Clerk authentication", value: "Connected", status: "active" },
      { label: "Stripe payments", value: "Connected", status: "active" },
      { label: "PayPal payments", value: "Connected", status: "active" },
      { label: "Django backend", value: "Connected", status: "active" },
    ],
  },
  {
    section: "Feature Flags",
    icon: ToggleLeft,
    description: "Enable or disable platform features globally",
    items: [
      { label: "Voice grievance filing", value: "Enabled", status: "active" },
      { label: "AI clause analysis", value: "Enabled", status: "active" },
      { label: "Mobile app access", value: "Enabled", status: "active" },
      { label: "Cross-union analytics", value: "Beta", status: "warning" },
    ],
  },
  {
    section: "Localization",
    icon: Globe,
    description: "Language and regional settings",
    items: [
      { label: "Default language", value: "English (en)", status: "active" },
      { label: "Supported locales", value: "en, fr", status: "active" },
      { label: "Date format", value: "YYYY-MM-DD", status: "active" },
      { label: "Currency", value: "CAD", status: "active" },
    ],
  },
  {
    section: "API Keys",
    icon: Key,
    description: "Platform API key management",
    items: [
      { label: "Production API key", value: "••••••••k7x2", status: "active" },
      { label: "Staging API key", value: "••••••••m3p9", status: "active" },
      { label: "Webhook signing secret", value: "••••••••a1b4", status: "active" },
    ],
  },
] as const;

function statusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700";
    case "warning":
      return "bg-yellow-100 text-yellow-700";
    case "inactive":
      return "bg-gray-100 text-gray-500";
    default:
      return "bg-gray-100 text-gray-500";
  }
}

export default async function AdminSettingsPage({ params: _params }: PageProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Settings className="h-8 w-8 text-blue-600" />
          System Settings
        </h2>
        <p className="text-gray-600 mt-2">
          Platform-wide configuration and feature management
        </p>
      </div>

      {/* Settings Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {SYSTEM_SETTINGS.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.section}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className="h-5 w-5 text-blue-600" />
                  {section.section}
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <span className="text-sm font-medium text-gray-700">
                        {item.label}
                      </span>
                      <Badge
                        variant="secondary"
                        className={statusColor(item.status)}
                      >
                        {item.value}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
