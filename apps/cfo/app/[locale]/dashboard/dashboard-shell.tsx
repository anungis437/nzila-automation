"use client";

import { useState, useEffect, useCallback } from "react";
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
  Menu,
  X,
  Calculator,
} from "lucide-react";

/* ─── sidebar item definitions ─── */
const allSidebarItems = [
  { title: "Dashboard", href: "dashboard", icon: LayoutDashboard },
  { title: "Clients", href: "clients", icon: Users },
  { title: "Client Portal", href: "client-portal", icon: BarChart3 },
  { title: "Ledger", href: "ledger", icon: BookOpen },
  { title: "Documents", href: "documents", icon: FileText },
  { title: "Tasks", href: "tasks", icon: CheckSquare2 },
  { title: "Reports", href: "reports", icon: Briefcase },
  { title: "Integrations", href: "integrations", icon: Plug },
  { title: "Tax Tools", href: "tax-tools", icon: Calculator },
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

/* ─── types ─── */
interface DashboardShellProps {
  children: React.ReactNode;
  /** Route keys the user can access. null = show everything (platform admin). */
  visiblePages: string[] | null;
  /** True when the user has a client role (client_owner / client_contact / client_viewer) */
  isClientUser: boolean;
  /** The user's firm or client role label — shown in sidebar badge */
  userRole: string | null;
}

/* ─── role badge colours ─── */
function roleBadge(role: string | null) {
  if (!role) return null;
  const label = role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className="mx-3 mb-1 inline-flex items-center rounded-md bg-electric/10 px-2 py-0.5 text-[10px] font-medium text-electric">
      {label}
    </span>
  );
}

/* ─── SidebarNav ─── */
function SidebarNav({
  pathname,
  items,
  onItemClick,
}: {
  pathname: string | null;
  items: typeof allSidebarItems;
  onItemClick?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const isActive = pathname?.includes(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
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
  );
}

/* ─── DashboardShell (client component) ─── */
export function DashboardShell({
  children,
  visiblePages,
  isClientUser,
  userRole,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filter sidebar items based on the user's visible pages
  const sidebarItems =
    visiblePages === null
      ? allSidebarItems
      : allSidebarItems.filter((item) => visiblePages.includes(item.href));

  // Close mobile menu on route change
  const [trackedPathname, setTrackedPathname] = useState(pathname);
  if (trackedPathname !== pathname) {
    setTrackedPathname(pathname);
    if (mobileMenuOpen) setMobileMenuOpen(false);
  }

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Close on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setMobileMenuOpen(false);
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const portalLabel = isClientUser ? "Client Portal" : "LedgerIQ";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r border-border bg-card lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric font-poppins text-xs font-bold text-white">
            LQ
          </div>
          <span className="font-poppins text-sm font-semibold text-foreground">
            {portalLabel}
          </span>
        </div>
        {roleBadge(userRole)}
        <SidebarNav pathname={pathname} items={sidebarItems} />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-border bg-card shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-border px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric font-poppins text-xs font-bold text-white">
                  LQ
                </div>
                <span className="font-poppins text-sm font-semibold text-foreground">
                  {portalLabel}
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 4rem)" }}>
              {roleBadge(userRole)}
              <SidebarNav
                pathname={pathname}
                items={sidebarItems}
                onItemClick={() => setMobileMenuOpen(false)}
              />
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b border-border px-6">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-poppins text-lg font-semibold text-foreground">
            {portalLabel}
          </h1>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
