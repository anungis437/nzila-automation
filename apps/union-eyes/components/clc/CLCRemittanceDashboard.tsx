"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

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
  // Mock data - replace with actual API call
  const remittances: RemittanceData[] = [
    {
      affiliateId: "1",
      affiliateName: "CUPE Local 79",
      province: "ON",
      membersCount: 3500,
      perCapitaRate: 2.50,
      amountDue: 8750,
      amountPaid: 8750,
      status: "paid",
      lastPaymentDate: "2026-02-05",
      dueDate: "2026-02-15"
    },
    {
      affiliateId: "2",
      affiliateName: "Unifor Local 444",
      province: "ON",
      membersCount: 8200,
      perCapitaRate: 2.50,
      amountDue: 20500,
      amountPaid: 20500,
      status: "paid",
      lastPaymentDate: "2026-02-08",
      dueDate: "2026-02-15"
    },
    {
      affiliateId: "3",
      affiliateName: "PSAC Local 610",
      province: "BC",
      membersCount: 1200,
      perCapitaRate: 2.50,
      amountDue: 3000,
      amountPaid: 1500,
      status: "partial",
      lastPaymentDate: "2026-02-01",
      dueDate: "2026-02-15"
    },
    {
      affiliateId: "4",
      affiliateName: "UFCW Local 1006A",
      province: "ON",
      membersCount: 5400,
      perCapitaRate: 2.50,
      amountDue: 13500,
      amountPaid: 0,
      status: "overdue",
      dueDate: "2026-01-15"
    }
  ];

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
