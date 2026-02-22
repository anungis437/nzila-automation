/**
 * Gauge Chart Component
 * 
 * Semi-circular gauge for displaying single metric against target
 * Supports color zones and threshold indicators
 * 
 * Created: December 5, 2025
 * Part of: Phase 2.3 - Advanced Visualizations
 */

'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// ============================================================================
// Types
// ============================================================================

export interface GaugeChartProps {
  value: number;
  min?: number;
  max?: number;
  title?: string;
  unit?: string;
  thresholds?: Array<{ value: number; color: string; label?: string }>;
  height?: number;
  showValue?: boolean;
}

// ============================================================================
// Default Thresholds
// ============================================================================

const DEFAULT_THRESHOLDS = [
  { value: 33, color: '#ef4444', label: 'Low' },
  { value: 66, color: '#f59e0b', label: 'Medium' },
  { value: 100, color: '#10b981', label: 'High' },
];

// ============================================================================
// Component
// ============================================================================

export function GaugeChart({
  value,
  min = 0,
  max = 100,
  title,
  unit = '',
  thresholds = DEFAULT_THRESHOLDS,
  height = 250,
  showValue = true,
}: GaugeChartProps) {
  // Normalize value to percentage
  const percentage = ((value - min) / (max - min)) * 100;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  // Determine color based on thresholds
  const getColor = () => {
    for (let i = 0; i < thresholds.length; i++) {
      if (clampedPercentage <= thresholds[i].value) {
        return thresholds[i].color;
      }
    }
    return thresholds[thresholds.length - 1].color;
  };

  // Create gauge data
  const gaugeData = [
    { value: clampedPercentage, color: getColor() },
    { value: 100 - clampedPercentage, color: '#e5e7eb' },
  ];

  // Needle angle calculation (180 degrees = semicircle)
  const needleAngle = (clampedPercentage / 100) * 180 - 90;

  return (
    <div className="w-full flex flex-col items-center">
      {title && <h3 className="text-lg font-semibold mb-2 text-center">{title}</h3>}
      
      <div className="relative" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={gaugeData}
              cx="50%"
              cy="80%"
              startAngle={180}
              endAngle={0}
              innerRadius="70%"
              outerRadius="100%"
              dataKey="value"
              stroke="none"
            >
              {gaugeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Needle */}
        <div
          className="absolute left-1/2 bottom-[20%] w-1 bg-gray-800 origin-bottom transition-transform duration-500"
          style={{
            height: `${height * 0.6}px`,
            transform: `translateX(-50%) rotate(${needleAngle}deg)`,
          }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gray-800 rounded-full" />
        </div>

        {/* Center dot */}
        <div className="absolute left-1/2 bottom-[20%] w-4 h-4 bg-gray-800 rounded-full -translate-x-1/2 translate-y-1/2 z-10" />
      </div>

      {/* Value display */}
      {showValue && (
        <div className="mt-4 text-center">
          <div className="text-3xl font-bold" style={{ color: getColor() }}>
            {value.toLocaleString()}{unit}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Range: {min} - {max}
          </div>
        </div>
      )}

      {/* Threshold labels */}
      <div className="flex justify-around w-full max-w-md mt-4">
        {thresholds.map((threshold, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: threshold.color }} />
            <span className="text-gray-600">{threshold.label || `${threshold.value}%`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GaugeChart;

