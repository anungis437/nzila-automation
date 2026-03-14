/**
 * Sector Analytics Page
 * Industry-wide trends and sector breakdown from real database
 * 
 * @role platform_lead
 * @dashboard_path /dashboard/sector-analytics
 */

export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { BarChart3, Users, AlertTriangle, Scale, FileText } from "lucide-react";
import { hasMinRole } from '@/lib/api-auth-guard';
import { logger } from '@/lib/logger';

async function getPlatformStats() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/platform/stats`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const json = await response.json();
    return json?.data ?? json ?? null;
  } catch (error) {
    logger.error('Error fetching platform stats for sector analytics:', error);
    return null;
  }
}

export default async function SectorAnalyticsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const hasAccess = await hasMinRole('platform_lead');
  if (!hasAccess) redirect('/dashboard');

  const stats = await getPlatformStats();
  const sectors: Array<{ sector: string; org_count: number; total_members: number }> = stats?.sectors ?? [];
  const orgs = stats?.organizations ?? [];
  const cba = stats?.collectiveAgreements ?? { total: 0, active: 0, negotiating: 0, expired: 0 };
  const grievances = stats?.grievances ?? { total: 0, open: 0, resolved: 0 };
  const settlements = stats?.settlements ?? { total: 0, totalMonetaryValue: 0 };
  
  const totalMembers = orgs.reduce((sum: number, o: { memberCount?: number }) => sum + (o.memberCount || 0), 0);
  const activeSectors = sectors.length;
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            Sector Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Industry-wide trends, wage data, and strategic intelligence across all sectors
          </p>
        </div>
      </div>

      {/* Sector Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Sectors</p>
              <p className="text-2xl font-bold">{activeSectors}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Members</p>
              <p className="text-2xl font-bold">{totalMembers.toLocaleString()}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active CBAs</p>
              <p className="text-2xl font-bold text-green-600">{cba.active}</p>
            </div>
            <FileText className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Open Grievances</p>
              <p className="text-2xl font-bold text-orange-600">{grievances.open}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Key Sectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sectors.length > 0 ? sectors.map((s) => (
          <div key={s.sector} className="border rounded-lg p-6 bg-card">
            <h3 className="text-lg font-semibold mb-4 capitalize">{s.sector.replace(/_/g, ' ')}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Organizations</span>
                <span className="font-semibold">{s.org_count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Members</span>
                <span className="font-semibold">{Number(s.total_members).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">CBAs</span>
                <span className="font-semibold">{cba.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Grievances</span>
                <span className="font-semibold">{grievances.total}</span>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-3 border rounded-lg p-8 bg-card text-center">
            <p className="text-muted-foreground">No sector data available yet. Organizations need sectors assigned.</p>
          </div>
        )}
      </div>

      {/* Settlement & Bargaining Summary */}
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Scale className="w-5 h-5" />
          Bargaining &amp; Settlements Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Collective Agreements</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-muted rounded">
                <span className="text-sm">Total CBAs</span>
                <span className="font-semibold">{cba.total}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted rounded">
                <span className="text-sm">Active</span>
                <span className="font-semibold text-green-600">{cba.active}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted rounded">
                <span className="text-sm">Under Negotiation</span>
                <span className="font-semibold text-blue-600">{cba.negotiating}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted rounded">
                <span className="text-sm">Expired</span>
                <span className="font-semibold text-red-600">{cba.expired}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Settlements &amp; Grievances</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-muted rounded">
                <span className="text-sm">Total Settlements</span>
                <span className="font-semibold">{settlements.total}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted rounded">
                <span className="text-sm">Total Monetary Value</span>
                <span className="font-semibold text-green-600">${Number(settlements.totalMonetaryValue).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted rounded">
                <span className="text-sm">Grievances Resolved</span>
                <span className="font-semibold text-green-600">{grievances.resolved}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted rounded">
                <span className="text-sm">Grievances Open</span>
                <span className="font-semibold text-orange-600">{grievances.open}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Analytics */}
      <div className="rounded-lg p-8 text-center bg-muted/50">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">Advanced Sector Analytics</h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Interactive wage comparisons, bargaining trend analysis, sector-specific organizing
          metrics, and strategic intelligence reports for national campaigns.
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          <strong>Note:</strong> This feature is restricted to Congress staff and system administrators
          to support national-level strategic planning and coordination.
        </p>
      </div>
    </div>
  );
}
