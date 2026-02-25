"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const statCards = [
  { label: "Active Quotes", value: "23", change: "+4 this week", trend: "up" },
  { label: "Total Revenue", value: "$45.2K", change: "+8% this month", trend: "up" },
  { label: "Avg Margin", value: "34%", change: "+2% from last month", trend: "up" },
  { label: "Active Clients", value: "42", change: "5 new this month", trend: "neutral" },
];

const quickActions = [
  { label: "New Quote", href: "quotes/new", icon: "📋" },
  { label: "Import Products", href: "import", icon: "📦" },
  { label: "View Analytics", href: "analytics", icon: "📈" },
  { label: "Manage Clients", href: "clients", icon: "👥" },
];

export default function DashboardPage() {
  const pathname = usePathname();
  const localeMatch = pathname.match(/^\/(en-CA|fr-CA)/);
  const locale = localeMatch?.[1] ?? "en-CA";
  const basePath = `/${locale}/dashboard`;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-poppins text-2xl font-bold text-navy">
          Welcome back
        </h2>
        <p className="mt-1 text-slate-500">
          Here&apos;s an overview of your quoting workspace.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="text-sm font-medium text-slate-500">
              {card.label}
            </div>
            <div className="mt-2 font-poppins text-3xl font-bold text-navy">
              {card.value}
            </div>
            <div className="mt-1 text-xs text-slate-400">{card.change}</div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-poppins text-lg font-semibold text-navy">
          Quick Actions
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={`${basePath}/${action.href}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="font-poppins text-sm font-semibold text-navy">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
