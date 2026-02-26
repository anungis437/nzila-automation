'use client'

import { useState, useTransition } from 'react'
import { updateAdminSettings, type AdminSettings } from '@/lib/actions/admin-actions'

export function AdminSettingsForm({ initial }: { initial: AdminSettings }) {
  const [settings, setSettings] = useState<AdminSettings>(initial)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleChange<K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateAdminSettings(settings)
      if (result.success) setSaved(true)
    })
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
      {/* Commission Rate */}
      <div className="p-6">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Default Commission Rate (%)
        </label>
        <input
          type="number"
          min={0}
          max={100}
          value={settings.defaultCommissionRate}
          onChange={(e) => handleChange('defaultCommissionRate', Number(e.target.value))}
          className="w-48 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-slate-400">Base rate before tier multiplier</p>
      </div>

      {/* Deal Protection */}
      <div className="p-6">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Deal Protection Window (days)
        </label>
        <input
          type="number"
          min={0}
          value={settings.dealProtectionDays}
          onChange={(e) => handleChange('dealProtectionDays', Number(e.target.value))}
          className="w-48 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-slate-400">Registered deals are locked for this period</p>
      </div>

      {/* Auto-approve */}
      <div className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700">Auto-Approve Deals</p>
          <p className="text-xs text-slate-400 mt-0.5">Skip manual review for new deal registrations</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.autoApproveDeals}
          onClick={() => handleChange('autoApproveDeals', !settings.autoApproveDeals)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
            settings.autoApproveDeals ? 'bg-blue-600' : 'bg-slate-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition ${
              settings.autoApproveDeals ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Cert required */}
      <div className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700">Require Certification for Tier Advancement</p>
          <p className="text-xs text-slate-400 mt-0.5">Partners must complete cert tracks before upgrading tier</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.requireCertForTierUp}
          onClick={() => handleChange('requireCertForTierUp', !settings.requireCertForTierUp)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
            settings.requireCertForTierUp ? 'bg-blue-600' : 'bg-slate-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition ${
              settings.requireCertForTierUp ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Notification email */}
      <div className="p-6">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Notification Email
        </label>
        <input
          type="email"
          value={settings.notificationEmail}
          onChange={(e) => handleChange('notificationEmail', e.target.value)}
          placeholder="partners@nzila.app"
          className="w-80 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-slate-400">Receives alerts for new registrations and escalations</p>
      </div>

      {/* Save */}
      <div className="p-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save Settings'}
        </button>
        {saved && <span className="text-sm text-green-600">Settings saved</span>}
      </div>
    </div>
  )
}
