'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface T4AGenerationDashboardProps {
  organizationId: string;
}

export default function T4AGenerationDashboard({ organizationId }: T4AGenerationDashboardProps) {
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const generateT4As = async () => {
    setGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/tax/t4a/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, taxYear }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate T4As');
      }

      setSuccess(`Successfully generated ${data.data.recordsGenerated} T4A records`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setGenerating(false);
    }
  };

  const downloadCRAXML = async (slipType: string = 't4a') => {
    setExporting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/tax/cra/export?organizationId=${organizationId}&taxYear=${taxYear}&slipType=${slipType}&download=true`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to export XML');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CRA_${slipType.toUpperCase()}_${taxYear}_${organizationId.slice(0, 8)}.xml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(`CRA XML file downloaded successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setExporting(false);
    }
  };

  const viewCOPEReceipts = (memberId: string) => {
    window.open(`/api/tax/cope/receipts?memberId=${memberId}&taxYear=${taxYear}`, '_blank');
  };

  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Tax Administration Dashboard</h2>
        <p className="text-gray-600 mt-1">T4A Generation, CRA XML Export, COPE Receipts</p>
      </div>

      {/* Tax Year Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Tax Year</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={taxYear}
            onChange={(e) => setTaxYear(parseInt(e.target.value))}
            aria-label="Select tax year"
            className="block w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 font-semibold">Error</p>
          <p className="text-red-600">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800 font-semibold">Success</p>
          <p className="text-green-600">{success}</p>
        </div>
      )}

      {/* T4A Generation */}
      <Card>
        <CardHeader>
          <CardTitle>T4A Generation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Generate T4A tax slips for all members with pension or union dues for the selected tax year.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> T4A slips must be issued to members and filed with CRA by February 28th.
            </p>
          </div>
          <button
            onClick={generateT4As}
            disabled={generating}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {generating ? 'Generating...' : `Generate T4As for ${taxYear}`}
          </button>
        </CardContent>
      </Card>

      {/* CRA XML Export */}
      <Card>
        <CardHeader>
          <CardTitle>CRA XML Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Download tax slip data in CRA XML format for electronic filing via Internet File Transfer (IFT).
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> Validate XML file with CRA&apos;s validation tool before submission.
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => downloadCRAXML('t4a')}
              disabled={exporting}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {exporting ? 'Exporting...' : 'Download T4A XML'}
            </button>
            <button
              onClick={() => downloadCRAXML('t4')}
              disabled={exporting}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {exporting ? 'Exporting...' : 'Download T4 XML'}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* COPE Receipts */}
      <Card>
        <CardHeader>
          <CardTitle>COPE Political Contribution Receipts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Issue tax receipts for union political action (COPE) contributions. Members can use these for tax deductions.
          </p>
          <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
            <p className="text-sm text-purple-800">
              <strong>Tax Tip:</strong> COPE contributions are tax-deductible for Canadian members under Income Tax Act.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Member ID"
                id="member-id-cope"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={() => {
                  const input = document.getElementById('member-id-cope') as HTMLInputElement;
                  if (input?.value) {
                    viewCOPEReceipts(input.value);
                  }
                }}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
              >
                View Receipt
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Enter a member ID to view their COPE contribution receipt for {taxYear}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tax Filing Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle>Important Tax Deadlines for {taxYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-700">T4/T4A Distribution to Members</span>
              <Badge className="bg-red-100 text-red-800">February 28, {taxYear + 1}</Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-700">T4/T4A Filing with CRA</span>
              <Badge className="bg-red-100 text-red-800">February 28, {taxYear + 1}</Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-700">COPE Receipts (No deadline, issue on request)</span>
              <Badge className="bg-green-100 text-green-800">Anytime</Badge>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-700">Member Tax Return Deadline</span>
              <Badge className="bg-blue-100 text-blue-800">April 30, {taxYear + 1}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Step-by-Step Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>
              <strong>Generate T4As:</strong> Click &quot;Generate T4As&quot; to create tax slips for all eligible members
            </li>
            <li>
              <strong>Review Generated Data:</strong> Check that amounts are correct before exporting
            </li>
            <li>
              <strong>Download CRA XML:</strong> Export XML file for electronic filing
            </li>
            <li>
              <strong>Validate XML:</strong> Use CRA&apos;s validation tool at{' '}
              <a
                href="https://www.canada.ca/en/revenue-agency/services/e-services/e-services-businesses/internet-file-transfer.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                canada.ca
              </a>
            </li>
            <li>
              <strong>Submit to CRA:</strong> Upload validated XML via Internet File Transfer (IFT)
            </li>
            <li>
              <strong>Distribute to Members:</strong> Email or mail T4A slips to members by February 28th
            </li>
            <li>
              <strong>Issue COPE Receipts:</strong> Generate political contribution receipts on member request
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Footer Warning */}
      <div className="bg-yellow-50 border border-yellow-300 rounded-md p-4 text-sm text-yellow-900">
        <p className="font-medium mb-2">⚠️ Compliance Warning:</p>
        <p>
          Failure to file T4/T4A slips by February 28th may result in penalties from CRA. Ensure all data is accurate
          before submission.
        </p>
      </div>
    </div>
  );
}

