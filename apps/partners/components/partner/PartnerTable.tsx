'use client'

import { useState, useTransition } from 'react'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import {
  updatePartnerStatus,
  updatePartnerTier,
} from '@/lib/actions/admin-actions'

interface Partner {
  id: string
  companyName: string
  type: string
  tier: string
  status: string
  clerkOrgId: string | null
  nzilaOwnerId: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-800',
  suspended: 'bg-red-100 text-red-800',
  deactivated: 'bg-slate-100 text-slate-800',
}

const TIER_COLORS: Record<string, string> = {
  elite: 'bg-purple-100 text-purple-800',
  strategic: 'bg-purple-100 text-purple-800',
  premier: 'bg-indigo-100 text-indigo-800',
  advanced: 'bg-indigo-100 text-indigo-800',
  enterprise: 'bg-indigo-100 text-indigo-800',
  professional: 'bg-blue-100 text-blue-800',
  certified: 'bg-blue-100 text-blue-800',
  select: 'bg-blue-100 text-blue-800',
  registered: 'bg-slate-100 text-slate-800',
}

export function PartnerTable({ partners }: { partners: Partner[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [tierFilter, setTierFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isPending, startTransition] = useTransition()

  const filtered = partners.filter((p) => {
    const matchesSearch = p.companyName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    const matchesTier = tierFilter === 'all' || p.tier === tierFilter
    const matchesType = typeFilter === 'all' || p.type === typeFilter
    return matchesSearch && matchesStatus && matchesTier && matchesType
  })

  function handleStatusChange(partnerId: string, status: string) {
    startTransition(async () => {
      await updatePartnerStatus(partnerId, status as 'pending' | 'active' | 'suspended' | 'churned')
    })
  }

  function handleTierChange(partnerId: string, tier: string) {
    startTransition(async () => {
      await updatePartnerTier(partnerId, tier as 'registered' | 'select' | 'elite')
    })
  }

  return (
    <>
      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search partners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Tiers</option>
            <option value="elite">Elite</option>
            <option value="select">Select</option>
            <option value="registered">Registered</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="channel">Channel</option>
            <option value="isv">ISV</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Company</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Type</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Tier</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Manager</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Joined</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((partner) => (
                <tr key={partner.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-slate-900">{partner.companyName}</p>
                    <p className="text-xs text-slate-500">{partner.clerkOrgId || 'No org linked'}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-slate-600 capitalize">{partner.type}</span>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={partner.tier}
                      onChange={(e) => handleTierChange(partner.id, e.target.value)}
                      disabled={isPending}
                      className={`px-2 py-0.5 rounded text-xs font-medium border-0 cursor-pointer ${TIER_COLORS[partner.tier] ?? 'bg-slate-100 text-slate-800'}`}
                    >
                      <option value="registered">Registered</option>
                      <option value="select">Select</option>
                      <option value="elite">Elite</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={partner.status}
                      onChange={(e) => handleStatusChange(partner.id, e.target.value)}
                      disabled={isPending}
                      className={`px-2 py-0.5 rounded text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[partner.status] ?? 'bg-slate-100 text-slate-800'}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="deactivated">Deactivated</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-slate-600">
                      {partner.nzilaOwnerId ? 'Assigned' : 'Unassigned'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-slate-500">
                      {partner.createdAt ? new Date(partner.createdAt).toLocaleDateString() : '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-slate-400">Inline edit →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">No partners found</p>
          </div>
        )}
      </div>
    </>
  )
}
