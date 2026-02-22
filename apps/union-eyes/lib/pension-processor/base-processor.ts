/**
 * Base Pension Processor
 * Abstract base class for pension plan processors
 */

import { Decimal } from 'decimal.js';
import { randomUUID } from 'node:crypto';
import type {
  IPensionProcessor,
  PensionPlanType,
  PensionMember,
  PensionableEarnings,
  ContributionCalculation,
  ContributionRates,
  ContributionRemittance,
  AnnualPensionStatement,
  PensionPlanConfig,
} from './types';
import { logger as appLogger } from '@/lib/logger';

/**
 * Base logger interface
 */
interface Logger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

/**
 * Default console logger
 */
class ConsoleLogger implements Logger {
  private formatMessage(level: string, message: string, context?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `\n  Context: ${JSON.stringify(context, null, 2)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  info(message: string, context?: Record<string, unknown>): void {
    appLogger.info(message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    appLogger.warn(message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    appLogger.error(message, undefined, context);
  }
}

/**
 * Abstract base pension processor
 */
export abstract class BasePensionProcessor implements IPensionProcessor {
  protected logger: Logger;
  protected initialized = false;
  protected contributionRatesCache: Map<number, ContributionRates> = new Map();

  constructor(
    public readonly type: PensionPlanType,
    protected config: PensionPlanConfig,
    logger?: Logger
  ) {
    this.logger = logger || new ConsoleLogger();
  }

  get environment(): 'sandbox' | 'production' {
    return this.config.environment;
  }

  /**
   * Initialize the processor
   */
  abstract initialize(): Promise<void>;

  /**
   * Calculate contribution for a member
   */
  abstract calculateContribution(
    member: PensionMember,
    earnings: PensionableEarnings,
    ytdEarnings?: Decimal,
    ytdContributions?: Decimal
  ): Promise<ContributionCalculation>;

  /**
   * Get current contribution rates
   */
  abstract getContributionRates(taxYear?: number): Promise<ContributionRates>;

  /**
   * Validate if earnings are pensionable
   */
  abstract isPensionableEarnings(
    member: PensionMember,
    earningsType: string
  ): boolean;

  /**
   * Create remittance for a period
   */
  async createRemittance(
    contributions: ContributionCalculation[],
    remittanceMonth: number,
    remittanceYear: number
  ): Promise<ContributionRemittance> {
    this.ensureInitialized();

    if (contributions.length === 0) {
      throw new Error('Cannot create remittance with no contributions');
    }

    // Aggregate contributions
    let totalPensionableEarnings = new Decimal(0);
    let totalEmployeeContributions = new Decimal(0);
    let totalEmployerContributions = new Decimal(0);
    const memberIds: string[] = [];

    for (const contribution of contributions) {
      totalPensionableEarnings = totalPensionableEarnings.plus(contribution.pensionableEarnings);
      totalEmployeeContributions = totalEmployeeContributions.plus(contribution.employeeContribution);
      totalEmployerContributions = totalEmployerContributions.plus(contribution.employerContribution);
      memberIds.push(contribution.memberId);
    }

    const totalContributions = totalEmployeeContributions.plus(totalEmployerContributions);

    // Calculate due date (typically 15th of following month)
    const dueDate = new Date(remittanceYear, remittanceMonth, 15);

    const remittance: ContributionRemittance = {
      id: randomUUID(),
      planType: this.type,
      remittanceMonth,
      remittanceYear,
      totalPensionableEarnings,
      totalEmployeeContributions,
      totalEmployerContributions,
      totalContributions,
      numberOfMembers: contributions.length,
      memberIds,
      dueDate,
      status: 'pending',
    };

    this.logger.info('Created remittance', {
      remittanceId: remittance.id,
      planType: this.type,
      numberOfMembers: remittance.numberOfMembers,
      totalContributions: totalContributions.toString(),
    });

    return remittance;
  }

  /**
   * Submit remittance to pension authority
   */
  abstract submitRemittance(remittanceId: string): Promise<ContributionRemittance>;

  /**
   * Generate annual statement for a member
   */
  abstract generateAnnualStatement(
    memberId: string,
    taxYear: number
  ): Promise<AnnualPensionStatement>;

  /**
   * Get plan capabilities
   */
  abstract getCapabilities(): {
    supportsElectronicRemittance: boolean;
    supportsAutomaticEnrollment: boolean;
    supportsBuyBack: boolean;
    supportsEarlyRetirement: boolean;
    minimumAge?: number;
    maximumAge?: number;
  };

  /**
   * Ensure processor is initialized
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(`Pension processor ${this.type} not initialized`);
    }
  }

  /**
   * Log info message
   */
  protected logInfo(message: string, context?: Record<string, unknown>): void {
    this.logger.info(`[${this.type.toUpperCase()}] ${message}`, context);
  }

  /**
   * Log warning message
   */
  protected logWarn(message: string, context?: Record<string, unknown>): void {
    this.logger.warn(`[${this.type.toUpperCase()}] ${message}`, context);
  }

  /**
   * Log error message
   */
  protected logError(message: string, context?: Record<string, unknown>): void {
    this.logger.error(`[${this.type.toUpperCase()}] ${message}`, context);
  }

  /**
   * Round to 2 decimal places (for currency)
   */
  protected roundCurrency(amount: Decimal): Decimal {
    return amount.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }

  /**
   * Calculate year-to-date with maximum cap
   */
  protected calculateYTDWithCap(
    currentAmount: Decimal,
    ytdAmount: Decimal,
    maximumAmount: Decimal
  ): { amount: Decimal; cappedAmount: Decimal; isAtMaximum: boolean } {
    const newYTD = ytdAmount.plus(currentAmount);
    
    if (newYTD.greaterThan(maximumAmount)) {
      const cappedAmount = maximumAmount.minus(ytdAmount);
      return {
        amount: cappedAmount.greaterThan(0) ? cappedAmount : new Decimal(0),
        cappedAmount,
        isAtMaximum: true,
      };
    }

    return {
      amount: currentAmount,
      cappedAmount: currentAmount,
      isAtMaximum: false,
    };
  }

  /**
   * Get tax year from date
   */
  protected getTaxYear(date?: Date): number {
    return (date || new Date()).getFullYear();
  }

  /**
   * Validate member eligibility
   */
  protected validateMemberEligibility(member: PensionMember): void {
    if (!member.id || !member.employeeNumber) {
      throw new Error('Member must have id and employee number');
    }

    if (!member.dateOfBirth) {
      throw new Error('Member must have date of birth');
    }

    if (!member.hireDate) {
      throw new Error('Member must have hire date');
    }
  }

  /**
   * Calculate member age
   */
  protected calculateAge(dateOfBirth: Date, asOfDate?: Date): number {
    const today = asOfDate || new Date();
    const birthDate = new Date(dateOfBirth);
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}
