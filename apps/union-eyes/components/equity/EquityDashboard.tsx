'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

interface EquityStats {
  total_members_consented: number;
  gender_distribution: {
    women: { count: number; percentage: string };
    men: { count: number; percentage: string };
    non_binary: { count: number; percentage: string };
  };
  equity_groups: {
    indigenous: {
      count: number;
      percentage: string;
      breakdown: {
        first_nations: number;
        inuit: number;
        metis: number;
      };
    };
    visible_minority: { count: number; percentage: string };
    persons_with_disabilities: { count: number; percentage: string };
    lgbtq2plus: { count: number; percentage: string };
    newcomer: { count: number; percentage: string };
  };
  intersectionality: {
    multiple_equity_groups_count: number;
    avg_intersectionality_score: string;
  };
}

interface Snapshot {
  id: string;
  snapshotDate: string;
  totalMembers: number;
  womenPercentage: number;
  indigenousPercentage: number;
  visibleMinorityPercentage: number;
  disabilityPercentage: number;
}

interface EquityDashboardProps {
  organizationId: string;
}

export default function EquityDashboard({ organizationId }: EquityDashboardProps) {
  const [stats, setStats] = useState<EquityStats | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insufficientData, setInsufficientData] = useState(false);

  const fetchEquityData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch current statistics
      const statsRes = await fetch(`/api/equity/monitoring?organizationId=${organizationId}`);
      const statsData = await statsRes.json();

      if (!statsRes.ok) {
        throw new Error(statsData.error || 'Failed to fetch equity statistics');
      }

      if (statsData.data?.insufficient_data) {
        setInsufficientData(true);
        setStats(null);
      } else {
        setStats(statsData.data);
        setInsufficientData(false);
      }

      // Fetch historical snapshots
      const snapshotsRes = await fetch(`/api/equity/snapshots?organizationId=${organizationId}&limit=12`);
      const snapshotsData = await snapshotsRes.json();

      if (snapshotsRes.ok) {
        setSnapshots(snapshotsData.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchEquityData();
  }, [fetchEquityData]);

  const generateSnapshot = async () => {
    try {
      const res = await fetch('/api/equity/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate snapshot');
      }

      // Refresh data
      fetchEquityData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate snapshot');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading equity dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-800 font-semibold">Error loading dashboard</p>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (insufficientData) {
    return (
      <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="text-xl font-semibold text-yellow-900 mb-2">Insufficient Data for Reporting</h3>
        <p className="text-yellow-800">
          At least 10 members with consent are required to display equity statistics. This protects member privacy.
        </p>
        <p className="text-yellow-700 mt-2">
          Current consented members: {stats?.total_members_consented || 0} / 10 required
        </p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-md">
        <p className="text-gray-700">No equity data available</p>
      </div>
    );
  }

  // Prepare chart data
  const genderData = [
    { name: 'Women', value: stats.gender_distribution.women.count, percentage: stats.gender_distribution.women.percentage },
    { name: 'Men', value: stats.gender_distribution.men.count, percentage: stats.gender_distribution.men.percentage },
    { name: 'Non-Binary', value: stats.gender_distribution.non_binary.count, percentage: stats.gender_distribution.non_binary.percentage },
  ];

  const equityGroupsData = [
    { name: 'Indigenous', value: parseFloat(stats.equity_groups.indigenous.percentage) },
    { name: 'Visible Minority', value: parseFloat(stats.equity_groups.visible_minority.percentage) },
    { name: 'Persons with Disabilities', value: parseFloat(stats.equity_groups.persons_with_disabilities.percentage) },
    { name: 'LGBTQ2+', value: parseFloat(stats.equity_groups.lgbtq2plus.percentage) },
    { name: 'Newcomer', value: parseFloat(stats.equity_groups.newcomer.percentage) },
  ];

  const indigenousBreakdown = [
    { name: 'First Nations', value: stats.equity_groups.indigenous.breakdown.first_nations },
    { name: 'Inuit', value: stats.equity_groups.indigenous.breakdown.inuit },
    { name: 'Métis', value: stats.equity_groups.indigenous.breakdown.metis },
  ];

  const timeSeriesData = snapshots
    .slice()
    .reverse()
    .map((snapshot) => ({
      date: new Date(snapshot.snapshotDate).toLocaleDateString('en-CA', { year: 'numeric', month: 'short' }),
      Women: snapshot.womenPercentage,
      Indigenous: snapshot.indigenousPercentage,
      'Visible Minority': snapshot.visibleMinorityPercentage,
      Disability: snapshot.disabilityPercentage,
    }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Equity & Inclusion Dashboard</h2>
          <p className="text-gray-600 mt-1">
            Anonymized statistics • {stats.total_members_consented} members consented
          </p>
        </div>
        <button
          onClick={generateSnapshot}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          Generate Snapshot
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-sm text-blue-800">
          <strong>Privacy Notice:</strong> All data is anonymized with a 10+ member threshold. Individual identities cannot be determined from these statistics.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Consented</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.total_members_consented}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Women</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.gender_distribution.women.percentage}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Indigenous</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.equity_groups.indigenous.percentage}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Multiple Groups (Intersectionality)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.intersectionality.multiple_equity_groups_count}</div>
            <div className="text-sm text-gray-600 mt-1">Avg Score: {stats.intersectionality.avg_intersectionality_score}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gender Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Gender Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Equity Groups */}
      <Card>
        <CardHeader>
          <CardTitle>Equity-Seeking Groups Representation</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={equityGroupsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Indigenous Breakdown */}
      {stats.equity_groups.indigenous.count > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Indigenous Peoples Breakdown (OCAP®)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={indigenousBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Time Series Trends */}
      {timeSeriesData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Representation Trends Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Women" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="Indigenous" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="Visible Minority" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="Disability" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Footer Notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-sm text-gray-600">
        <p className="font-medium mb-2">About This Data:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>All data is voluntarily self-reported by members</li>
          <li>Statistics require minimum 10 members with consent</li>
          <li>Indigenous data governed by OCAP® principles</li>
          <li>Intersectionality score measures membership in multiple equity groups</li>
        </ul>
      </div>
    </div>
  );
}

