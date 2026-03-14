/**
 * Customer Success Dashboard
 * For Customer Success Director - User success, retention, and growth
 * Fetches real data from /api/platform/stats
 * 
 * @role customer_success_director
 * @dashboard_path /dashboard/customer-success
 */


export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CustomerHealthScoresWidget,
  OnboardingProgressWidget,
  ChurnRiskWidget,
  AdoptionMetricsWidget,
  NPSWidget,
  CustomerFeedbackWidget
} from '@/components/customer-success/dashboard-widgets';
import type { OrgData } from '@/components/customer-success/dashboard-widgets';
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
    logger.error('Error fetching platform stats:', error);
    return null;
  }
}

export default async function CustomerSuccessDashboard() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  // Require customer success role
  const hasAccess = await hasMinRole('customer_success_director');
  if (!hasAccess) {
    redirect('/dashboard');
  }

  const stats = await getPlatformStats();
  const organizations: OrgData[] = stats?.organizations ?? [];
  const grievances = stats?.grievances ?? { total: 0, open: 0, resolved: 0, highPriority: 0, inArbitration: 0 };
  const cba = stats?.collectiveAgreements ?? { total: 0, active: 0, negotiating: 0, expired: 0 };
  const settlements = stats?.settlements ?? { total: 0, totalMonetaryValue: 0 };
  
  const totalOrgs = organizations.length;
  const activeOrgs = organizations.filter((o: OrgData) => o.status === 'active').length;
  const totalMembers = organizations.reduce((sum: number, o: OrgData) => sum + (o.memberCount || 0), 0);
  const atRiskOrgs = organizations.filter((o: OrgData) => o.status !== 'active' || o.activeMemberCount === 0).length;
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Success</h1>
          <p className="text-muted-foreground mt-1">
            Monitor customer health, onboarding, and retention metrics
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="health">Customer Health</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="churn">Churn Risk</TabsTrigger>
          <TabsTrigger value="adoption">Adoption</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Suspense fallback={<CardSkeleton />}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalOrgs}</div>
                  <p className="text-xs text-muted-foreground">
                    {activeOrgs} active
                  </p>
                </CardContent>
              </Card>
            </Suspense>
            
            <Suspense fallback={<CardSkeleton />}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalMembers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    across all organizations
                  </p>
                </CardContent>
              </Card>
            </Suspense>
            
            <Suspense fallback={<CardSkeleton />}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Open Grievances</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{grievances.open}</div>
                  <p className="text-xs text-muted-foreground">
                    {grievances.resolved} resolved
                  </p>
                </CardContent>
              </Card>
            </Suspense>
            
            <Suspense fallback={<CardSkeleton />}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">At-Risk Organizations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{atRiskOrgs}</div>
                  <p className="text-xs text-muted-foreground">
                    Require attention
                  </p>
                </CardContent>
              </Card>
            </Suspense>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Suspense fallback={<CardSkeleton />}>
              <CustomerHealthScoresWidget organizations={organizations} />
            </Suspense>
            
            <Suspense fallback={<CardSkeleton />}>
              <AdoptionMetricsWidget grievances={grievances} collectiveAgreements={cba} />
            </Suspense>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Suspense fallback={<CardSkeleton />}>
              <OnboardingProgressWidget organizations={organizations} />
            </Suspense>
            
            <Suspense fallback={<CardSkeleton />}>
              <ChurnRiskWidget organizations={organizations} />
            </Suspense>
          </div>
        </TabsContent>
        
        {/* Customer Health Tab */}
        <TabsContent value="health" className="space-y-4">
          <Suspense fallback={<CardSkeleton />}>
            <CustomerHealthScoresWidget detailed organizations={organizations} />
          </Suspense>
        </TabsContent>
        
        {/* Onboarding Tab */}
        <TabsContent value="onboarding" className="space-y-4">
          <Suspense fallback={<CardSkeleton />}>
            <OnboardingProgressWidget detailed organizations={organizations} />
          </Suspense>
        </TabsContent>
        
        {/* Churn Risk Tab */}
        <TabsContent value="churn" className="space-y-4">
          <Suspense fallback={<CardSkeleton />}>
            <ChurnRiskWidget detailed organizations={organizations} />
          </Suspense>
        </TabsContent>
        
        {/* Adoption Tab */}
        <TabsContent value="adoption" className="space-y-4">
          <Suspense fallback={<CardSkeleton />}>
            <AdoptionMetricsWidget detailed grievances={grievances} collectiveAgreements={cba} />
          </Suspense>
        </TabsContent>
        
        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-4">
          <Suspense fallback={<CardSkeleton />}>
            <CustomerFeedbackWidget organizations={organizations} settlements={settlements} />
          </Suspense>
          <Suspense fallback={<CardSkeleton />}>
            <NPSWidget detailed organizations={organizations} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        <div className="h-3 w-32 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-full bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  );
}
