/**
 * Signal Badge Component
 * 
 * Visual indicator for signal severity with icon and text.
 */

import type { Signal, SignalSeverity } from '@/lib/services/lro-signals';

interface SignalBadgeProps {
  signal: Signal;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function SignalBadge({ signal, size = 'md', showText = true }: SignalBadgeProps) {
  const config = getSeverityConfig(signal.severity);
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${config.bgColor} ${config.textColor}
        ${sizeClasses[size]}
      `}
      title={signal.description}
    >
      <span className={size === 'sm' ? 'text-xs' : 'text-base'}>{config.icon}</span>
      {showText && <span className="font-semibold">{config.label}</span>}
    </div>
  );
}

interface SeverityConfig {
  icon: string;
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

function getSeverityConfig(severity: SignalSeverity): SeverityConfig {
  const configs: Record<SignalSeverity, SeverityConfig> = {
    critical: {
      icon: '🔴',
      label: 'Critical',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-300',
    },
    urgent: {
      icon: '🟠',
      label: 'Urgent',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
      borderColor: 'border-orange-300',
    },
    warning: {
      icon: '🟡',
      label: 'Warning',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-300',
    },
    info: {
      icon: '🔵',
      label: 'Info',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-300',
    },
  };

  return configs[severity];
}

/**
 * Minimal signal indicator (just colored dot)
 */
export function SignalDot({ severity }: { severity: SignalSeverity }) {
  const colors: Record<SignalSeverity, string> = {
    critical: 'bg-red-500',
    urgent: 'bg-orange-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  };

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colors[severity]}`}
      aria-label={severity}
    />
  );
}

/**
 * Signal type badge (shows specific signal type)
 */
export function SignalTypeBadge({ signal }: { signal: Signal }) {
  const typeLabels: Record<Signal['type'], string> = {
    sla_breached: 'SLA Breached',
    sla_at_risk: 'SLA At Risk',
    acknowledgment_overdue: 'Ack Overdue',
    member_waiting: 'Member Waiting',
    case_stale: 'Stale',
    escalation_needed: 'Escalate',
    urgent_state: 'Urgent State',
  };

  const config = getSeverityConfig(signal.severity);

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
        ${config.bgColor} ${config.textColor}
      `}
    >
      {typeLabels[signal.type]}
    </span>
  );
}

