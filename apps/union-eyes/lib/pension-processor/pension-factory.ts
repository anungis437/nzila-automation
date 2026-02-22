/**
 * Pension Processor Factory
 * Manages pension plan processor instances
 */

import type {
  IPensionProcessor,
  PensionPlanType,
  PensionPlanConfig,
} from './types';
import { PensionProcessorError } from './types';
import { CPPQPPProcessor } from './processors/cpp-qpp-processor';
import { OTTPProcessor } from './processors/otpp-processor';
import { logger } from '@/lib/logger';

/**
 * Factory configuration
 */
export interface PensionFactoryConfig {
  defaultPlan?: PensionPlanType;
  plans: Record<PensionPlanType, PensionPlanConfig>;
}

/**
 * Pension Processor Factory
 * Singleton pattern for managing pension processors
 */
export class PensionProcessorFactory {
  private static instance: PensionProcessorFactory;
  private processors: Map<PensionPlanType, IPensionProcessor> = new Map();
  private defaultPlan?: PensionPlanType;
  private initialized = false;

  /**
   * Private constructor for singleton
   */
  private constructor() {}

  /**
   * Get factory instance
   */
  static getInstance(): PensionProcessorFactory {
    if (!PensionProcessorFactory.instance) {
      PensionProcessorFactory.instance = new PensionProcessorFactory();
    }
    return PensionProcessorFactory.instance;
  }

  /**
   * Initialize factory with configuration
   */
  async initialize(config: PensionFactoryConfig): Promise<void> {
    if (this.initialized) {
      logger.warn('Pension factory already initialized');
      return;
    }

    logger.info('Initializing pension processor factory', {
      defaultPlan: config.defaultPlan,
      plansCount: Object.keys(config.plans).length,
    });

    this.defaultPlan = config.defaultPlan;

    // Initialize each configured processor
    const initPromises: Promise<void>[] = [];

    for (const [planType, planConfig] of Object.entries(config.plans)) {
      const processor = this.createProcessor(
        planType as PensionPlanType,
        planConfig
      );
      
      if (processor) {
        this.processors.set(planType as PensionPlanType, processor);
        initPromises.push(this.initializeProcessor(planType as PensionPlanType, processor));
      }
    }

    // Initialize all processors in parallel
    await Promise.all(initPromises);

    this.initialized = true;
    
    logger.info('Pension processor factory initialized', {
      defaultPlan: this.defaultPlan,
      processorsCount: this.processors.size,
      processors: Array.from(this.processors.keys()),
    });
  }

  /**
   * Create processor instance
   */
  private createProcessor(
    planType: PensionPlanType,
    config: PensionPlanConfig
  ): IPensionProcessor | null {
    switch (planType) {
      case 'cpp':
      case 'qpp':
        return new CPPQPPProcessor(planType, config);
      
      case 'otpp':
        return new OTTPProcessor(config);
      
      default:
        logger.error('Unknown pension plan type', undefined, { planType });
        return null;
    }
  }

  /**
   * Initialize a single processor
   */
  private async initializeProcessor(
    planType: PensionPlanType,
    processor: IPensionProcessor
  ): Promise<void> {
    try {
      await processor.initialize();
      logger.info('Initialized processor successfully', { planType });
    } catch (error) {
      logger.error('Failed to initialize processor', error, { planType });
      // Remove failed processor
      this.processors.delete(planType);
      throw error;
    }
  }

  /**
   * Get processor by type
   */
  getProcessor(planType: PensionPlanType): IPensionProcessor {
    this.ensureInitialized();

    const processor = this.processors.get(planType);
    if (!processor) {
      throw new PensionProcessorError(
        `Processor ${planType} not configured or unavailable`,
        planType,
        'PROCESSOR_NOT_FOUND'
      );
    }

    return processor;
  }

  /**
   * Get default processor
   */
  getDefaultProcessor(): IPensionProcessor {
    this.ensureInitialized();

    if (!this.defaultPlan) {
      throw new Error('No default pension plan configured');
    }

    return this.getProcessor(this.defaultPlan);
  }

  /**
   * Get all available processors
   */
  getAvailableProcessors(): PensionPlanType[] {
    return Array.from(this.processors.keys());
  }

  /**
   * Check if processor is available
   */
  isProcessorAvailable(planType: PensionPlanType): boolean {
    return this.processors.has(planType);
  }

  /**
   * Get processor capabilities
   */
  getProcessorCapabilities(planType: PensionPlanType) {
    const processor = this.getProcessor(planType);
    return processor.getCapabilities();
  }

  /**
   * Reset factory (useful for testing)
   */
  reset(): void {
    this.processors.clear();
    this.defaultPlan = undefined;
    this.initialized = false;
  }

  /**
   * Ensure factory is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Pension processor factory not initialized');
    }
  }
}

// Export singleton instance
export const pensionFactory = PensionProcessorFactory.getInstance();
