/**
 * Chart Components Index
 * 
 * Central export point for all advanced chart visualizations
 * 
 * Created: December 5, 2025
 * Part of: Phase 2.3 - Advanced Visualizations
 */

// Basic Charts
export { ScatterChart } from './ScatterChart';
export { BubbleChart } from './BubbleChart';

// Statistical Charts
export { BoxPlotChart, calculateBoxPlotStats } from './BoxPlotChart';
export { CandlestickChart } from './CandlestickChart';

// Hierarchical Charts
export { TreemapChart } from './TreemapChart';
export { SunburstChart } from './SunburstChart';
export { SankeyChart } from './SankeyChart';

// Process Charts
export { FunnelChart } from './FunnelChart';
export { WaterfallChart } from './WaterfallChart';

// Gauge Charts
export { GaugeChart } from './GaugeChart';

// Data Display
export { DataTable } from './DataTable';
export type { Column, DataTableProps } from './DataTable';

// Export Utilities
export { ChartExporter } from './ChartExporter';
export type { ExportOptions, ChartExporterProps } from './ChartExporter';

// Re-export common types
export type {
  BubbleChartProps,
  ScatterChartProps,
  TreemapChartProps,
  SankeyChartProps,
  BoxPlotData,
  BoxPlotChartProps,
  CandlestickData,
  CandlestickChartProps,
  FunnelChartProps,
  WaterfallChartProps,
  GaugeChartProps,
  SunburstNode,
  SunburstChartProps,
} from './types';

