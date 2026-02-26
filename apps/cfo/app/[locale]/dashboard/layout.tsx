"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  CheckSquare2,
  Briefcase,
  Plug,
  GitBranch,
  AlertTriangle,
  Brain,
  Zap,
  MessageCircle,
  Settings,
  Shield,
  ScrollText,
  Building2,
  BarChart3,
  Bell,
} from "lucide-react";

const sidebarItems = [
  { title: "Dashboard", href: "dashboard", icon: LayoutDashboard },
  { title: "Clients", href: "clients", icon: Users },
  { title: "Client Portal", href: "client-portal", icon: BarChart3 },
  { title: "Ledger", href: "ledger", icon: BookOpen },
  { title: "Documents", href: "documents", icon: FileText },
  { title: "Tasks", href: "tasks", icon: CheckSquare2 },
  { title: "Reports", href: "reports", icon: Briefcase },
  { title: "Integrations", href: "integrations", icon: Plug },
  { title: "Workflows", href: "workflows", icon: GitBranch },
  { title: "Alerts", href: "alerts", icon: AlertTriangle },
  { title: "Notifications", href: "notifications", icon: Bell },
  { title: "Advisory AI", href: "advisory-ai", icon: Brain },
  { title: "AI Insights", href: "ai-insights", icon: Zap },
  { title: "Messages", href: "messages", icon: MessageCircle },
  { title: "Security", href: "security", icon: Shield },
  { title: "Audit Trail", href: "audit", icon: ScrollText },
  { title: "Platform Admin", href: "platform-admin", icon: Building2 },
  { title: "Settings", href: "settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r border-border bg-card lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric font-poppins text-xs font-bold text-white">
            LQ
          </div>
          <span className="font-poppins text-sm font-semibold text-foreground">
            LedgerIQ
          </span>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {sidebarItems.map((item) => {
            const isActive = pathname?.includes(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-electric/10 font-medium text-electric"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center border-b border-border px-6">
          <h1 className="font-poppins text-lg font-semibold text-foreground">
            LedgerIQ
          </h1>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
