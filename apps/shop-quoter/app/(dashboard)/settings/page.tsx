'use client'

import { useState } from 'react'
import {
  CogIcon,
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  BellIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline'

const tabs = [
  { id: 'general', label: 'General', icon: CogIcon },
  { id: 'org', label: 'Organisation', icon: BuildingOffice2Icon },
  { id: 'pricing', label: 'Pricing', icon: CurrencyDollarIcon },
  { id: 'governance', label: 'Governance', icon: ShieldCheckIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
  { id: 'appearance', label: 'Appearance', icon: PaintBrushIcon },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure your Shop Quoter workspace.
        </p>
      </div>

      <div className="flex gap-8">
        {/* Tabs sidebar */}
        <nav className="w-48 shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition ${
                activeTab === tab.id
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'org' && <OrgSettings />}
          {activeTab === 'pricing' && <PricingSettings />}
          {activeTab === 'governance' && <GovernanceSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'appearance' && <AppearanceSettings />}
        </div>
      </div>
    </div>
  )
}

// ── Tab Panels ─────────────────────────────────────────────────────────────

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
      <p className="text-sm text-gray-500 mb-5">{description}</p>
      {children}
    </div>
  )
}

function GeneralSettings() {
  return (
    <>
      <SettingsCard
        title="Workspace"
        description="Basic workspace configuration."
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workspace Name
            </label>
            <input
              type="text"
              defaultValue="Shop Quoter"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Currency
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="CAD">CAD — Canadian Dollar</option>
              <option value="USD">USD — US Dollar</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Format
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quote Validity (days)
            </label>
            <input
              type="number"
              defaultValue={30}
              min={7}
              max={90}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition">
            Save
          </button>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Reference Format"
        description="Configure how quote reference numbers are generated."
      >
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Prefix:</span>
          <input
            type="text"
            defaultValue="SQ"
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
          />
          <span className="text-sm text-gray-500">Preview: SQ-2026-001</span>
        </div>
      </SettingsCard>
    </>
  )
}

function OrgSettings() {
  return (
    <SettingsCard
      title="Organisation"
      description="Your business details for quote letterheads."
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
          <input
            type="text"
            defaultValue="Nzila Ventures SENC"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">NEQ</label>
          <input
            type="text"
            placeholder="1234567890"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">GST #</label>
          <input
            type="text"
            placeholder="RT0001"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">QST #</label>
          <input
            type="text"
            placeholder="TQ-0001-0001"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea
            rows={2}
            defaultValue="Montréal, QC, Canada"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition">
          Save
        </button>
      </div>
    </SettingsCard>
  )
}

function PricingSettings() {
  return (
    <SettingsCard
      title="Pricing Configuration"
      description="Configure tax rates and margin thresholds."
    >
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
          <input
            type="number"
            defaultValue={5}
            step={0.001}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            disabled
          />
          <p className="text-xs text-gray-400 mt-1">Federal rate — automatically applied.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">QST Rate (%)</label>
          <input
            type="number"
            defaultValue={9.975}
            step={0.001}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            disabled
          />
          <p className="text-xs text-gray-400 mt-1">Quebec rate — calculated on base + GST.</p>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-gray-700 mb-3">Margin Floors</h3>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Budget Tier</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              defaultValue={15}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Standard Tier</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              defaultValue={25}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Premium Tier</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              defaultValue={35}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition">
          Save
        </button>
      </div>
    </SettingsCard>
  )
}

function GovernanceSettings() {
  return (
    <SettingsCard
      title="Governance Gates"
      description="Configure quote approval gates and governance rules."
    >
      <div className="space-y-4">
        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <input type="checkbox" defaultChecked className="rounded" />
          <div>
            <p className="text-sm font-medium text-gray-900">Margin Floor Gate</p>
            <p className="text-xs text-gray-500">Block quotes below the configured margin threshold.</p>
          </div>
        </label>
        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <input type="checkbox" defaultChecked className="rounded" />
          <div>
            <p className="text-sm font-medium text-gray-900">Approval Required Gate</p>
            <p className="text-xs text-gray-500">Require manager approval for quotes above a threshold.</p>
          </div>
        </label>
        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <input type="checkbox" className="rounded" />
          <div>
            <p className="text-sm font-medium text-gray-900">Dual Sign-off Gate</p>
            <p className="text-xs text-gray-500">Require two approvers for high-value quotes.</p>
          </div>
        </label>
        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <input type="checkbox" defaultChecked className="rounded" />
          <div>
            <p className="text-sm font-medium text-gray-900">Audit Trail Enforcement</p>
            <p className="text-xs text-gray-500">Every status transition produces a hash-chained audit entry.</p>
          </div>
        </label>
      </div>
      <div className="mt-4 flex justify-end">
        <button className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition">
          Save
        </button>
      </div>
    </SettingsCard>
  )
}

function NotificationSettings() {
  return (
    <SettingsCard
      title="Notifications"
      description="Configure email and in-app notification preferences."
    >
      <div className="space-y-4">
        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <input type="checkbox" defaultChecked className="rounded" />
          <div>
            <p className="text-sm font-medium text-gray-900">Quote accepted</p>
            <p className="text-xs text-gray-500">Notify when a client accepts a quote.</p>
          </div>
        </label>
        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <input type="checkbox" defaultChecked className="rounded" />
          <div>
            <p className="text-sm font-medium text-gray-900">Quote expiring soon</p>
            <p className="text-xs text-gray-500">Notify 3 days before a quote expires.</p>
          </div>
        </label>
        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <input type="checkbox" className="rounded" />
          <div>
            <p className="text-sm font-medium text-gray-900">Import completed</p>
            <p className="text-xs text-gray-500">Notify when a legacy import batch finishes.</p>
          </div>
        </label>
      </div>
      <div className="mt-4 flex justify-end">
        <button className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition">
          Save
        </button>
      </div>
    </SettingsCard>
  )
}

function AppearanceSettings() {
  return (
    <SettingsCard
      title="Appearance"
      description="Customise the look and feel of your workspace."
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="light">Light</option>
            <option value="dark">Dark (coming soon)</option>
            <option value="system">System</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Accent Colour</label>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-600 border-2 border-purple-300" />
            <span className="text-sm text-gray-500">#7C3AED</span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition">
          Save
        </button>
      </div>
    </SettingsCard>
  )
}
