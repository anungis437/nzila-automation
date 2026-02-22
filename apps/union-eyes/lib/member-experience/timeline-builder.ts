// @ts-nocheck
/**
 * Timeline Builder Service
 * 
 * Converts FSM state transitions into visual timeline stages
 * with human-readable explanations for member-facing displays.
 */

import { getHumanExplainer, HumanExplanation } from '@/lib/member-experience/human-explainers';

export interface TimelineStage {
  id: string;
  status: string; // FSM status
  title: string;
  description: string;
  timestamp: Date;
  daysInStage: number;
  isCurrentStage: boolean;
  isPastStage: boolean;
  isFutureStage: boolean;
  explanation: HumanExplanation;
  metadata?: Record<string, unknown>;
}

export interface TimelineContext {
  caseId: string;
  currentStatus: string;
  statusHistory: {
    status: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
  }[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedSteward?: {
    id: string;
    name: string;
  };
  caseType?: string;
}

/**
 * Build a visual timeline from case status history
 */
export function buildCaseTimeline(context: TimelineContext): TimelineStage[] {
  const stages: TimelineStage[] = [];
  const now = new Date();
  const currentStatusIndex = context.statusHistory.findIndex(
    (h) => h.status === context.currentStatus
  );

  context.statusHistory.forEach((history, index) => {
    const isCurrentStage = history.status === context.currentStatus;
    const isPastStage = index < currentStatusIndex;
    const isFutureStage = index > currentStatusIndex;

    // Calculate days in this stage
    const nextTransition = context.statusHistory[index + 1];
    const endTime = nextTransition ? new Date(nextTransition.timestamp) : now;
    const startTime = new Date(history.timestamp);
    const daysInStage = Math.ceil(
      (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Get human explanation
    const explanation = getHumanExplainer({
      status: history.status as unknown,
      daysInStatus: isCurrentStage ? daysInStage : 0,
      priority: context.priority,
      assignedSteward: context.assignedSteward,
      caseType: context.caseType,
    });

    stages.push({
      id: `${context.caseId}-stage-${index}`,
      status: history.status,
      title: explanation.title,
      description: explanation.explanation,
      timestamp: startTime,
      daysInStage,
      isCurrentStage,
      isPastStage,
      isFutureStage,
      explanation,
      metadata: history.metadata,
    });
  });

  return stages;
}

/**
 * Get estimated time remaining for current stage
 */
export function estimateTimeRemaining(stage: TimelineStage): string {
  const expectedTimeline = stage.explanation.expectedTimeline;
  
  if (!expectedTimeline) {
    return 'Timeline varies by case';
  }

  // Parse the expectedTimeline string (e.g., "24-48 hours", "5-10 business days")
  const match = expectedTimeline.match(/(\d+)-?(\d+)?\s*(hours?|days?|weeks?)/i);
  
  if (!match) {
    return expectedTimeline;
  }

  const [, minStr, maxStr, unit] = match;
  const min = parseInt(minStr);
  const max = maxStr ? parseInt(maxStr) : min;

  // Convert to days
  let minDays = min;
  let maxDays = max;

  if (unit.toLowerCase().includes('hour')) {
    minDays = min / 24;
    maxDays = max / 24;
  } else if (unit.toLowerCase().includes('week')) {
    minDays = min * 7;
    maxDays = max * 7;
  }

  const avgDays = (minDays + maxDays) / 2;
  const remainingDays = Math.max(0, avgDays - stage.daysInStage);

  if (remainingDays < 1) {
    return 'Should complete soon';
  } else if (remainingDays < 2) {
    return 'About 1 day remaining';
  } else if (remainingDays < 7) {
    return `About ${Math.round(remainingDays)} days remaining`;
  } else {
    const weeks = Math.round(remainingDays / 7);
    return `About ${weeks} ${weeks === 1 ? 'week' : 'weeks'} remaining`;
  }
}

/**
 * Determine if a stage is taking longer than expected
 */
export function isStageDelayed(stage: TimelineStage): boolean {
  const expectedTimeline = stage.explanation.expectedTimeline;
  
  if (!expectedTimeline) {
    return false;
  }

  const match = expectedTimeline.match(/(\d+)-?(\d+)?\s*(hours?|days?|weeks?)/i);
  
  if (!match) {
    return false;
  }

  const [, , maxStr, unit] = match;
  const max = maxStr ? parseInt(maxStr) : parseInt(match[1]);

  // Convert to days
  let maxDays = max;

  if (unit.toLowerCase().includes('hour')) {
    maxDays = max / 24;
  } else if (unit.toLowerCase().includes('week')) {
    maxDays = max * 7;
  }

  // Consider delayed if 150% of max expected time
  return stage.daysInStage > maxDays * 1.5;
}

/**
 * Get progress percentage for the entire case
 */
export function calculateCaseProgress(stages: TimelineStage[]): number {
  const totalStages = stages.length;
  const currentStageIndex = stages.findIndex((s) => s.isCurrentStage);
  
  if (currentStageIndex === -1) {
    return 100; // Case closed
  }

  // Calculate progress: completed stages + partial progress in current stage
  const completedStages = stages.filter((s) => s.isPastStage).length;
  
  // Estimate progress within current stage (capped at 50% to avoid false hope)
  const currentStage = stages[currentStageIndex];
  const expectedTimeline = currentStage.explanation.expectedTimeline;
  
  let stageProgress = 0;
  if (expectedTimeline) {
    const match = expectedTimeline.match(/(\d+)-?(\d+)?\s*(hours?|days?|weeks?)/i);
    if (match) {
      const [, minStr, , unit] = match;
      const min = parseInt(minStr);
      let minDays = min;
      
      if (unit.toLowerCase().includes('hour')) {
        minDays = min / 24;
      } else if (unit.toLowerCase().includes('week')) {
        minDays = min * 7;
      }
      
      stageProgress = Math.min(0.5, currentStage.daysInStage / minDays);
    }
  }

  const progress = ((completedStages + stageProgress) / totalStages) * 100;
  return Math.round(progress);
}

/**
 * Get a summary of the case journey
 */
export function getCaseJourneySummary(context: TimelineContext): {
  totalDays: number;
  currentStageTitle: string;
  estimatedCompletion: string;
  isOnTrack: boolean;
} {
  const stages = buildCaseTimeline(context);
  const currentStage = stages.find((s) => s.isCurrentStage);
  
  const firstStage = stages[0];
  const totalDays = Math.ceil(
    (new Date().getTime() - new Date(firstStage.timestamp).getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    totalDays,
    currentStageTitle: currentStage?.title || 'Unknown',
    estimatedCompletion: currentStage ? estimateTimeRemaining(currentStage) : 'N/A',
    isOnTrack: currentStage ? !isStageDelayed(currentStage) : true,
  };
}

/**
 * Generate a human-readable case status update for notifications
 */
export function generateStatusUpdateMessage(
  previousStatus: string,
  newStatus: string,
  context: Partial<TimelineContext>
): string {
  const explanation = getHumanExplainer({
    status: newStatus as unknown,
    daysInStatus: 0,
    priority: context.priority,
    assignedSteward: context.assignedSteward,
    caseType: context.caseType,
  });

  let message = `Your case has moved to: ${explanation.title}\n\n`;
  message += `${explanation.explanation}\n\n`;
  
  if (explanation.nextSteps.length > 0) {
    message += `Next steps:\n`;
    explanation.nextSteps.forEach((step) => {
      message += `• ${step}\n`;
    });
  }

  if (explanation.expectedTimeline) {
    message += `\nExpected timeline: ${explanation.expectedTimeline}`;
  }

  if (explanation.empathyMessage) {
    message += `\n\n${explanation.empathyMessage}`;
  }

  return message;
}
