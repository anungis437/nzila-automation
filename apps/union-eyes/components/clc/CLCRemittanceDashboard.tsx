"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface RemittanceData {
  affiliateId: string;
  affiliateName: string;
  province: string;
  membersCount: number;
  perCapitaRate: number;
  amountDue: number;
  amountPaid: number;
  status: "paid" | "partial" | "overdue" | "pending";
  lastPaymentDate?: string;
  dueDate: string;
}

interface CLCRemittanceDashboardProps {
  period: string; // e.g., "2026-02"
}

export default function CLCRemittanceDashboard({ period }: CLCRemittanceDashboardProps) {
  const [remittances, setRemittances] = useState<RemittanceData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRemittances = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v2/clc/remittances?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data?.results ?? data?.data ?? [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setRemittances(items.map((r: any) => ({
          affiliateId: String(r.affiliateId ?? r.affiliate_id ?? r.id),
          affiliateName: r.affiliateName ?? r.affiliate_name ?? '',
          province: r.province ?? '',
          membersCount: r.membersCount ?? r.members_count ?? 0,
          perCapitaRate: r.perCapitaRate ?? r.per_capita_rate ?? 0,
          amountDue: r.amountDue ?? r.amount_due ?? 0,
          amountPaid: r.amountPaid ?? r.amount_paid ?? 0,
          status: r.status ?? 'pending',
          lastPaymentDate: r.lastPaymentDate ?? r.last_payment_date,
          dueDate: r.dueDate ?? r.due_date ?? '',
        })));
      }
    } catch {
      // API not available — empty state
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchRemittances(); }, [fetchRemittances]);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const totalDue = remittances.reduce((sum, r) => sum + r.amountDue, 0);
  const totalPaid = remittances.reduce((sum, r) => sum + r.amountPaid, 0);
  const collectionRate = (totalPaid / totalDue) * 100;
  
  const statusCounts = remittances.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-500/10 text-green-700 border-green-500/20";
      case "partial": return "bg-amber-500/10 text-amber-700 border-amber-500/20";
      case "overdue": return "bg-red-500/10 text-red-700 border-red-500/20";
      case "pending": return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      default: return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle className="h-4 w-4" />;
      case "overdue": return <AlertCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Due</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalDue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {remittances.length} affiliates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPaid.toLocaleString()}</div>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {collectionRate.toFixed(1)}% collection rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalDue - totalPaid).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {statusCounts.partial || 0} partial, {statusCounts.overdue || 0} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.paid || 0}/{remittances.length}</div>
            <p className="text-xs text-muted-foreground">
              {((statusCounts.paid || 0) / remittances.length * 100).toFixed(0)}% fully paid
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Remittances Table */}
      <Card>
        <CardHeader>
          <CardTitle>Affiliate Remittances - {period}</CardTitle>
          <CardDescription>Per-capita remittance tracking for all affiliates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Affiliate</th>
                  <th className="text-left p-2 font-medium">Province</th>
                  <th className="text-right p-2 font-medium">Members</th>
                  <th className="text-right p-2 font-medium">Rate</th>
                  <th className="text-right p-2 font-medium">Due</th>
                  <th className="text-right p-2 font-medium">Paid</th>
                  <th className="text-center p-2 font-medium">Status</th>
                  <th className="text-left p-2 font-medium">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {remittances.map((remittance) => (
                  <tr key={remittance.affiliateId} className="border-b hover:bg-accent/50">
                    <td className="p-2">{remittance.affiliateName}</td>
                    <td className="p-2">
                      <Badge variant="outline">{remittance.province}</Badge>
                    </td>
                    <td className="text-right p-2">{remittance.membersCount.toLocaleString()}</td>
                    <td className="text-right p-2">${remittance.perCapitaRate.toFixed(2)}</td>
                    <td className="text-right p-2 font-medium">${remittance.amountDue.toLocaleString()}</td>
                    <td className="text-right p-2">${remittance.amountPaid.toLocaleString()}</td>
                    <td className="text-center p-2">
                      <Badge variant="outline" className={`${getStatusColor(remittance.status)} flex items-center gap-1 justify-center`}>
                        {getStatusIcon(remittance.status)}
                        {remittance.status}
                      </Badge>
                    </td>
                    <td className="p-2 text-sm text-muted-foreground">
                      {new Date(remittance.dueDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
