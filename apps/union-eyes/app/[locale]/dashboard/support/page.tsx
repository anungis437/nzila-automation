/**
 * Support Operations Dashboard
 * For Support Manager & Support Agents - Help desk operations
 * 
 * @role support_manager, support_agent
 * @dashboard_path /dashboard/support
 */


export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { hasMinRole } from '@/lib/api-auth-guard';
import { Headphones, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';
import { logger } from '@/lib/logger';

// Fetch support data from platform stats API (grievances serve as support items)
async function getSupportData() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/platform/stats`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const json = await response.json();
    return json?.data ?? json ?? null;
  } catch (error) {
    logger.error('Error fetching support data:', error);
    return null;
  }
}

export default async function SupportDashboard() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  // Require support role
  const hasAccess = await hasMinRole('support_agent');
  if (!hasAccess) {
    redirect('/dashboard');
  }
  
  // Fetch real data
  const stats = await getSupportData();
  
  const grievances = stats?.grievances ?? { total: 0, open: 0, highPriority: 0, resolved: 0, inArbitration: 0 };
  const settlements = stats?.settlements ?? { total: 0, totalMonetaryValue: 0 };
  const totalOrgs = stats?.organizations?.length ?? 0;
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support Operations</h1>
        <p className="text-muted-foreground mt-1">
          Manage customer support tickets and knowledge base
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Headphones className="h-4 w-4" />
              Open Grievances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{grievances.open}</div>
            <p className="text-xs text-muted-foreground">{grievances.highPriority} high priority</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              In Arbitration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{grievances.inArbitration}</div>
            <p className="text-xs text-muted-foreground">
              Require legal attention
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{grievances.resolved}</div>
            <p className="text-xs text-muted-foreground">{grievances.total} total grievances</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Settlements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settlements.total}</div>
            <p className="text-xs text-muted-foreground">${Number(settlements.totalMonetaryValue).toLocaleString()} total value</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Grievance Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">High Priority</Badge>
                <span className="text-sm font-medium">Urgent cases</span>
              </div>
              <span className="text-lg font-bold">{grievances.highPriority}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Open</Badge>
                <span className="text-sm font-medium">Active grievances</span>
              </div>
              <span className="text-lg font-bold">{grievances.open}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">In Arbitration</Badge>
                <span className="text-sm font-medium">Legal proceedings</span>
              </div>
              <span className="text-lg font-bold">{grievances.inArbitration}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="default">Resolved</Badge>
                <span className="text-sm font-medium">Settled or closed</span>
              </div>
              <span className="text-lg font-bold text-green-600">{grievances.resolved}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Total Organizations Served</span>
              </div>
              <span className="text-lg font-bold">{totalOrgs}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
