import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  dark?: boolean;
}

export default function GlassCard({ children, className = '', dark = false }: GlassCardProps) {
  return (
    <div
      className={`rounded-2xl ${
        dark ? 'glass-card' : 'glass-card-light'
      } ${className}`}
    >
      {children}
    </div>
  );
}
