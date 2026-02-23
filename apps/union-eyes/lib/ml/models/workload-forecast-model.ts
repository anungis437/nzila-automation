/**
 * Workload Forecast Model
 * 
 * Uses TensorFlow.js to predict case volume based on historical patterns.
 * This replaces the simple moving average with an actual time series model.
 * 
 * Features (7 inputs):
 * - dayOfWeek (0-6)
 * - weekOfYear (1-52)
 * - monthOfYear (1-12)
 * - isHoliday (0-1)
 * - recentAvg (7-day moving average)
 * - recentTrend (slope)
 * - seasonalFactor (calculated from history)
 * 
 * Output: Predicted case volume (integer)
 */

import * as tf from '@tensorflow/tfjs-node';
import * as path from 'path';
import * as fs from 'fs/promises';
import { logger } from '@/lib/logger';

export interface WorkloadFeatures {
  dayOfWeek: number;        // 0-6 (Sunday=0)
  weekOfYear: number;       // 1-52
  monthOfYear: number;      // 1-12
  isHoliday: number;        // 0 or 1
  recentAvg: number;        // 7-day moving average
  recentTrend: number;      // Slope of recent trend (-1 to 1)
  seasonalFactor: number;   // Seasonal multiplier (0.5-1.5)
}

export interface WorkloadPredictionResult {
  predictedVolume: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  confidence: number;
  modelVersion: string;
}

const MODEL_VERSION = 'v1.0.0';
const MODEL_PATH = path.join(process.cwd(), 'lib', 'ml', 'models', 'saved', 'workload-model');

let modelInstance: tf.LayersModel | null = null;
let modelLoaded = false;

/**
 * Feature normalization parameters
 */
const NORMALIZATION_PARAMS = {
  dayOfWeek: { mean: 3, std: 2 },
  weekOfYear: { mean: 26, std: 15 },
  monthOfYear: { mean: 6.5, std: 3.5 },
  isHoliday: { mean: 0.05, std: 0.22 },
  recentAvg: { mean: 15, std: 8 },
  recentTrend: { mean: 0, std: 0.3 },
  seasonalFactor: { mean: 1.0, std: 0.2 }
};

/**
 * Normalize features
 */
function normalizeFeatures(features: WorkloadFeatures): number[] {
  return [
    (features.dayOfWeek - NORMALIZATION_PARAMS.dayOfWeek.mean) / NORMALIZATION_PARAMS.dayOfWeek.std,
    (features.weekOfYear - NORMALIZATION_PARAMS.weekOfYear.mean) / NORMALIZATION_PARAMS.weekOfYear.std,
    (features.monthOfYear - NORMALIZATION_PARAMS.monthOfYear.mean) / NORMALIZATION_PARAMS.monthOfYear.std,
    (features.isHoliday - NORMALIZATION_PARAMS.isHoliday.mean) / NORMALIZATION_PARAMS.isHoliday.std,
    (features.recentAvg - NORMALIZATION_PARAMS.recentAvg.mean) / NORMALIZATION_PARAMS.recentAvg.std,
    (features.recentTrend - NORMALIZATION_PARAMS.recentTrend.mean) / NORMALIZATION_PARAMS.recentTrend.std,
    (features.seasonalFactor - NORMALIZATION_PARAMS.seasonalFactor.mean) / NORMALIZATION_PARAMS.seasonalFactor.std
  ];
}

/**
 * Create a time series forecasting model
 * Architecture: Dense layers good for daily forecasts with engineered features
 */
export function createWorkloadModel(): tf.LayersModel {
  const model = tf.sequential({
    layers: [
      tf.layers.dense({
        inputShape: [7],
        units: 32,
        activation: 'relu',
        kernelInitializer: 'heNormal'
      }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({
        units: 16,
        activation: 'relu',
        kernelInitializer: 'heNormal'
      }),
      tf.layers.dense({
        units: 8,
        activation: 'relu',
        kernelInitializer: 'heNormal'
      }),
      tf.layers.dense({
        units: 1,
        activation: 'linear' // Linear for regression
      })
    ]
  });

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError',
    metrics: ['mae']
  });

  return model;
}

/**
 * Load the trained workload forecast model
 */
export async function loadWorkloadModel(): Promise<tf.LayersModel> {
  if (modelLoaded && modelInstance) {
    return modelInstance;
  }

  try {
    const modelJsonPath = path.join(MODEL_PATH, 'model.json');
    await fs.access(modelJsonPath);

    modelInstance = await tf.loadLayersModel(`file://${modelJsonPath}`);
    modelLoaded = true;
    logger.info('Loaded trained workload forecast model from disk');
    return modelInstance;
  } catch {
    logger.info('No trained model found, creating new model with synthetic initialization');
    modelInstance = createWorkloadModel();

    // Synthetic pre-training
    await syntheticPreTrain(modelInstance);
    
    modelLoaded = true;
    logger.info('Created new workload forecast model with synthetic pre-training');
    return modelInstance;
  }
}

/**
 * Synthetic pre-training for workload forecasting
 */
async function syntheticPreTrain(model: tf.LayersModel): Promise<void> {
  const syntheticExamples = [];
  const syntheticTargets = [];

  // Generate 200 synthetic examples based on known patterns
  for (let i = 0; i < 200; i++) {
    const dayOfWeek = Math.floor(Math.random() * 7);
    const weekOfYear = 1 + Math.floor(Math.random() * 52);
    const monthOfYear = 1 + Math.floor(Math.random() * 12);
    const isHoliday = Math.random() < 0.05 ? 1 : 0;
    const recentAvg = 10 + Math.random() * 10;
    const recentTrend = -0.5 + Math.random();
    const seasonalFactor = 0.8 + Math.random() * 0.4;

    // Synthetic target: apply known patterns
    let target = recentAvg * seasonalFactor;
    
    // Weekday boost (Mon-Fri higher)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      target *= 1.2;
    } else {
      target *= 0.7; // Weekend reduction
    }

    // Holiday reduction
    if (isHoliday === 1) {
      target *= 0.5;
    }

    // Apply trend
    target += recentTrend * 2;

    // Add some noise
    target += (Math.random() - 0.5) * 3;

    // Ensure non-negative
    target = Math.max(0, target);

    syntheticExamples.push(normalizeFeatures({
      dayOfWeek,
      weekOfYear,
      monthOfYear,
      isHoliday,
      recentAvg,
      recentTrend,
      seasonalFactor
    }));
    syntheticTargets.push(target);
  }

  const xs = tf.tensor2d(syntheticExamples);
  const ys = tf.tensor2d(syntheticTargets, [syntheticTargets.length, 1]);

  await model.fit(xs, ys, {
    epochs: 100,
    batchSize: 32,
    verbose: 0
  });

  xs.dispose();
  ys.dispose();
}

/**
 * Predict workload for given features
 */
export async function predictWorkload(
  features: WorkloadFeatures
): Promise<WorkloadPredictionResult> {
  const model = await loadWorkloadModel();

  // Normalize features
  const normalizedFeatures = normalizeFeatures(features);

  // Create tensor and predict
  const inputTensor = tf.tensor2d([normalizedFeatures], [1, 7]);
  const prediction = model.predict(inputTensor) as tf.Tensor;
  const rawPrediction = (await prediction.data())[0];

  // Cleanup tensors
  inputTensor.dispose();
  prediction.dispose();

  // Ensure non-negative and round to integer
  const predictedVolume = Math.max(0, Math.round(rawPrediction));

  // Calculate confidence interval (±20% based on model uncertainty)
  const uncertainty = 0.20;
  const confidenceWidth = predictedVolume * uncertainty;

  const confidenceInterval = {
    lower: Math.max(0, Math.round(predictedVolume - confidenceWidth)),
    upper: Math.round(predictedVolume + confidenceWidth)
  };

  // Calculate confidence score (0-1)
  // Higher confidence for predictions with more consistent historical data
  const confidence = Math.min(0.95, 0.65 + (features.recentAvg > 5 ? 0.15 : 0) + 
                                      (Math.abs(features.recentTrend) < 0.3 ? 0.15 : 0));

  return {
    predictedVolume,
    confidenceInterval,
    confidence,
    modelVersion: MODEL_VERSION
  };
}

/**
 * Batch predict for multiple days
 */
export async function predictWorkloadBatch(
  featuresArray: WorkloadFeatures[]
): Promise<WorkloadPredictionResult[]> {
  const model = await loadWorkloadModel();

  // Normalize all features
  const normalizedBatch = featuresArray.map(f => normalizeFeatures(f));

  // Create batch tensor and predict
  const inputTensor = tf.tensor2d(normalizedBatch);
  const predictions = model.predict(inputTensor) as tf.Tensor;
  const rawPredictions = await predictions.data();

  // Cleanup tensors
  inputTensor.dispose();
  predictions.dispose();

  // Process results
  return featuresArray.map((features, idx) => {
    const rawPrediction = rawPredictions[idx];
    const predictedVolume = Math.max(0, Math.round(rawPrediction));

    const uncertainty = 0.20;
    const confidenceWidth = predictedVolume * uncertainty;

    const confidenceInterval = {
      lower: Math.max(0, Math.round(predictedVolume - confidenceWidth)),
      upper: Math.round(predictedVolume + confidenceWidth)
    };

    const confidence = Math.min(0.95, 0.65 + (features.recentAvg > 5 ? 0.15 : 0) + 
                                        (Math.abs(features.recentTrend) < 0.3 ? 0.15 : 0));

    return {
      predictedVolume,
      confidenceInterval,
      confidence,
      modelVersion: MODEL_VERSION
    };
  });
}

/**
 * Save the trained model to disk
 */
export async function saveWorkloadModel(model: tf.LayersModel): Promise<void> {
  await fs.mkdir(MODEL_PATH, { recursive: true });
  await model.save(`file://${MODEL_PATH}`);
  logger.info('Saved workload model', { path: MODEL_PATH });
}

/**
 * Get model metadata
 */
export function getModelMetadata() {
  return {
    version: MODEL_VERSION,
    features: [
      'dayOfWeek',
      'weekOfYear',
      'monthOfYear',
      'isHoliday',
      'recentAvg',
      'recentTrend',
      'seasonalFactor'
    ],
    normalization: NORMALIZATION_PARAMS,
    architecture: {
      type: 'sequential',
      layers: [
        { type: 'dense', units: 32, activation: 'relu' },
        { type: 'dropout', rate: 0.2 },
        { type: 'dense', units: 16, activation: 'relu' },
        { type: 'dense', units: 8, activation: 'relu' },
        { type: 'dense', units: 1, activation: 'linear' }
      ]
    }
  };
}

/**
 * Calculate moving average from historical data
 */
export function calculateMovingAverage(values: number[], window: number = 7): number {
  if (values.length === 0) return 0;
  if (values.length < window) window = values.length;

  const recentValues = values.slice(-window);
  return recentValues.reduce((sum, val) => sum + val, 0) / window;
}

/**
 * Calculate trend slope from recent data
 */
export function calculateTrend(values: number[], window: number = 14): number {
  if (values.length < 2) return 0;
  if (values.length < window) window = values.length;

  const recentValues = values.slice(-window);
  
  // Simple linear regression slope
  const n = recentValues.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = recentValues.reduce((sum, val) => sum + val, 0);
  const sumXY = recentValues.reduce((sum, val, idx) => sum + idx * val, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  // Normalize to -1 to 1 range
  return Math.max(-1, Math.min(1, slope));
}

/**
 * Check if date is a major holiday
 */
export function isHoliday(date: Date): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = date.getDay();

  // Major holidays
  const holidays = [
    { month: 1, day: 1 },   // New Year's Day
    { month: 7, day: 1 },   // Canada Day
    { month: 7, day: 4 },   // Independence Day
    { month: 12, day: 25 }, // Christmas
    { month: 12, day: 26 }, // Boxing Day
  ];

  for (const holiday of holidays) {
    if (month === holiday.month && day === holiday.day) {
      return true;
    }
  }

  // Labour Day (first Monday of September)
  if (month === 9 && dayOfWeek === 1 && day <= 7) {
    return true;
  }

  // Thanksgiving US (fourth Thursday of November)
  if (month === 11 && dayOfWeek === 4 && day >= 22 && day <= 28) {
    return true;
  }

  return false;
}
