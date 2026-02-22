/**
 * Jurisdiction Badge Component
 * Display jurisdiction with flag icon and name
 * Phase 5D: Jurisdiction Framework
 */

'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CAJurisdiction } from '@/lib/jurisdiction-helpers-client';
import { getJurisdictionName } from '@/lib/jurisdiction-helpers-client';

// Re-export type for convenience
export type { CAJurisdiction };

interface JurisdictionBadgeProps {
  jurisdiction: CAJurisdiction;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'secondary' | 'outline';
  className?: string;
}

const JURISDICTION_COLORS: Record<CAJurisdiction, string> = {
  'CA-FED': 'bg-red-100 text-red-800 border-red-300',
  'CA-ON': 'bg-blue-100 text-blue-800 border-blue-300',
  'CA-QC': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'CA-BC': 'bg-green-100 text-green-800 border-green-300',
  'CA-AB': 'bg-orange-100 text-orange-800 border-orange-300',
  'CA-SK': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'CA-MB': 'bg-purple-100 text-purple-800 border-purple-300',
  'CA-NB': 'bg-pink-100 text-pink-800 border-pink-300',
  'CA-NS': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  'CA-PE': 'bg-teal-100 text-teal-800 border-teal-300',
  'CA-NL': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'CA-NT': 'bg-slate-100 text-slate-800 border-slate-300',
  'CA-NU': 'bg-zinc-100 text-zinc-800 border-zinc-300',
  'CA-YT': 'bg-stone-100 text-stone-800 border-stone-300'
};

// Flag emoji components for Canadian provinces/territories
const FLAG_ICONS: Record<CAJurisdiction, string> = {
  'CA-FED': '🇨🇦',
  'CA-ON': '🏛️',
  'CA-QC': '⚜️',
  'CA-BC': '🌲',
  'CA-AB': '🛢️',
  'CA-SK': '🌾',
  'CA-MB': '🦬',
  'CA-NB': '🦞',
  'CA-NS': '⛵',
  'CA-PE': '🌊',
  'CA-NL': '🐟',
  'CA-NT': '❄️',
  'CA-NU': '🐻‍❄️',
  'CA-YT': '⛰️'
};

export function JurisdictionBadge({
  jurisdiction,
  showName = true,
  size = 'md',
  variant = 'default',
  className
}: JurisdictionBadgeProps) {
  const name = getJurisdictionName(jurisdiction);
  const color = JURISDICTION_COLORS[jurisdiction];
  const icon = FLAG_ICONS[jurisdiction];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge
      variant={variant}
      className={cn(
        'inline-flex items-center gap-1.5 font-medium',
        variant === 'default' && color,
        sizeClasses[size],
        className
      )}
    >
      <span className="text-base">{icon}</span>
      {showName && <span>{name}</span>}
      {!showName && <span className="font-semibold">{jurisdiction}</span>}
    </Badge>
  );
}

// Compact version showing only code
export function JurisdictionCode({
  jurisdiction,
  className
}: {
  jurisdiction: CAJurisdiction;
  className?: string;
}) {
  return (
    <JurisdictionBadge
      jurisdiction={jurisdiction}
      showName={false}
      size="sm"
      className={className}
    />
  );
}

// Full name version
export function JurisdictionName({
  jurisdiction,
  className
}: {
  jurisdiction: CAJurisdiction;
  className?: string;
}) {
  return (
    <JurisdictionBadge
      jurisdiction={jurisdiction}
      showName={true}
      className={className}
    />
  );
}

