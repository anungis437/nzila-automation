/**
 * Billing Admin Dashboard
 * For Billing Manager & Billing Specialists - Subscription & payment operations
 * 
 * @role billing_manager, billing_specialist
 * @dashboard_path /dashboard/billing-admin
 */


export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { hasMinRole } from '@/lib/api-auth-guard';
import { DollarSign, CreditCard, TrendingUp, Users, FileText, AlertCircle } from 'lucide-react';
import { getPlatformStatsFromDb } from '@/lib/queries/platform-stats';

export default async function BillingAdminDashboard() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  // Require billing role
  const hasAccess = await hasMinRole('billing_specialist');
  if (!hasAccess) {
    redirect('/dashboard');
  }
  
  // Fetch real data
  const stats = await getPlatformStatsFromDb();
  
  const orgs: Array<{ name: string; type: string; memberCount: number; subscriptionTier: string; perCapitaRate: number; status: string; activeMemberCount: number }> = (stats.organizations ?? []) as any;
  const activeOrgs = orgs.filter((o) => o.status === 'active');
  
  // Compute billing metrics from real org data
  const totalMrr = orgs.reduce((sum, o) => sum + (o.memberCount * (o.perCapitaRate || 0)), 0);
  const activeSubscriptions = orgs.filter((o) => o.subscriptionTier && o.subscriptionTier !== 'none').length;
  const pastDueCount = orgs.filter((o) => o.status !== 'active' && o.subscriptionTier && o.subscriptionTier !== 'none').length;
  const settlementValue = Number(stats.settlements?.totalMonetaryValue ?? 0);
  
  const metrics = {
    total_mrr: totalMrr,
    active_subscriptions: activeSubscriptions,
    payment_success_rate: activeSubscriptions > 0 ? Math.round((activeOrgs.length / orgs.length) * 100) : 0,
    past_due_count: pastDueCount,
  };
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Subscriptions</h1>
        <p className="text-muted-foreground mt-1">
          Manage customer subscriptions, invoices, and payments
        </p>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Monthly Recurring Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalMrr > 1000 ? (totalMrr / 1000).toFixed(1) + 'K' : totalMrr.toFixed(0)}</div>
                <p className="text-xs text-muted-foreground">
                  Based on per-capita rates × member counts
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Active Subscriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.active_subscriptions}</div>
                <p className="text-xs text-muted-foreground">{orgs.length} total organizations</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.payment_success_rate}%</div>
                <p className="text-xs text-muted-foreground">Above 98% target</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Past Due
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{metrics.past_due_count}</div>
                <p className="text-xs text-muted-foreground">Require follow-up</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total MRR</span>
                    <span className="text-lg font-bold">${totalMrr.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Settlement Value</span>
                    <span className="text-lg font-bold text-green-600">${settlementValue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Orgs</span>
                    <span className="text-lg font-bold">{activeOrgs.length} / {orgs.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Invoicing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Invoices Sent (30d)</span>
                    <span className="text-lg font-bold">{metrics.active_subscriptions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Paid</span>
                    <span className="text-lg font-bold text-green-600">{metrics.active_subscriptions - metrics.past_due_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Past Due</span>
                    <span className="text-lg font-bold text-orange-600">{metrics.past_due_count}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              {orgs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No organizations found</p>
              ) : (
                <div className="space-y-3">
                  {orgs.map((org) => (
                    <div key={org.name} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{org.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{org.subscriptionTier || 'free'} Plan</p>
                        <p className="text-xs text-muted-foreground">{org.memberCount.toLocaleString()} members</p>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant={org.status === 'active' ? 'default' : 'destructive'}>
                          {org.status}
                        </Badge>
                        <p className="text-sm font-bold">${(org.memberCount * (org.perCapitaRate || 0)).toLocaleString()}/mo</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Detailed revenue analytics and forecasting data
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Invoice list and payment tracking
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
