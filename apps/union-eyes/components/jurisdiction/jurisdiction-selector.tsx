/**
 * Jurisdiction Selector Component
 * Dropdown picker for selecting Canadian jurisdictions
 * Phase 5D: Jurisdiction Framework
 */

'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { JurisdictionBadge, type CAJurisdiction } from './jurisdiction-badge';

interface JurisdictionSelectorProps {
  value?: CAJurisdiction;
  onChange: (value: CAJurisdiction) => void;
  includeFederal?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const JURISDICTIONS: { value: CAJurisdiction; label: string }[] = [
  { value: 'CA-FED', label: 'Federal' },
  { value: 'CA-ON', label: 'Ontario' },
  { value: 'CA-QC', label: 'Quebec' },
  { value: 'CA-BC', label: 'British Columbia' },
  { value: 'CA-AB', label: 'Alberta' },
  { value: 'CA-SK', label: 'Saskatchewan' },
  { value: 'CA-MB', label: 'Manitoba' },
  { value: 'CA-NB', label: 'New Brunswick' },
  { value: 'CA-NS', label: 'Nova Scotia' },
  { value: 'CA-PE', label: 'Prince Edward Island' },
  { value: 'CA-NL', label: 'Newfoundland and Labrador' },
  { value: 'CA-NT', label: 'Northwest Territories' },
  { value: 'CA-NU', label: 'Nunavut' },
  { value: 'CA-YT', label: 'Yukon' }
];

export function JurisdictionSelector({
  value,
  onChange,
  includeFederal = true,
  disabled = false,
  placeholder = 'Select jurisdiction',
  className
}: JurisdictionSelectorProps) {
  const jurisdictions = includeFederal
    ? JURISDICTIONS
    : JURISDICTIONS.filter(j => j.value !== 'CA-FED');

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          {value && <JurisdictionBadge jurisdiction={value} size="sm" />}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {jurisdictions.map(jurisdiction => (
          <SelectItem key={jurisdiction.value} value={jurisdiction.value}>
            <JurisdictionBadge
              jurisdiction={jurisdiction.value}
              size="sm"
              variant="outline"
            />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Multi-select version for comparing jurisdictions
interface MultiJurisdictionSelectorProps {
  value: CAJurisdiction[];
  onChange: (value: CAJurisdiction[]) => void;
  includeFederal?: boolean;
  maxSelections?: number;
  disabled?: boolean;
  className?: string;
}

export function MultiJurisdictionSelector({
  value,
  onChange,
  includeFederal = true,
  maxSelections,
  disabled = false,
  className
}: MultiJurisdictionSelectorProps) {
  const jurisdictions = includeFederal
    ? JURISDICTIONS
    : JURISDICTIONS.filter(j => j.value !== 'CA-FED');

  const handleToggle = (jurisdiction: CAJurisdiction) => {
    if (value.includes(jurisdiction)) {
      onChange(value.filter(j => j !== jurisdiction));
    } else {
      if (maxSelections && value.length >= maxSelections) {
        return; // Max selections reached
      }
      onChange([...value, jurisdiction]);
    }
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map(jurisdiction => (
          <button
            key={jurisdiction}
            onClick={() => handleToggle(jurisdiction)}
            disabled={disabled}
            className="relative"
          >
            <JurisdictionBadge
              jurisdiction={jurisdiction}
              size="sm"
              variant="default"
            />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
              ×
            </span>
          </button>
        ))}
      </div>
      <Select
        onValueChange={(val) => handleToggle(val as CAJurisdiction)}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Add jurisdiction to compare" />
        </SelectTrigger>
        <SelectContent>
          {jurisdictions
            .filter(j => !value.includes(j.value))
            .map(jurisdiction => (
              <SelectItem key={jurisdiction.value} value={jurisdiction.value}>
                <JurisdictionBadge
                  jurisdiction={jurisdiction.value}
                  size="sm"
                  variant="outline"
                />
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      {maxSelections && (
        <p className="text-xs text-muted-foreground mt-1">
          {value.length} / {maxSelections} jurisdictions selected
        </p>
      )}
    </div>
  );
}

