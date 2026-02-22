/**
 * Organizer Impact Calculator
 * 
 * Calculate aggregate impact metrics for organizers WITHOUT surveillance.
 * Focus on system health and member outcomes, not individual productivity.
 */

import { OrganizerImpact, RecognitionEvent } from '@/types/marketing';

export interface ImpactCalculationInput {
  organizerId: string;
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  casesData: {
    id: string;
    status: string;
    createdAt: Date;
    resolvedAt?: Date;
    memberSatisfaction?: number; // 1-5 scale
    escalated: boolean;
    democraticActions?: number; // votes, surveys, etc.
  }[];
  recognitionEvents?: RecognitionEvent[];
}

export interface ImpactMetrics {
  casesHandled: number;
  casesWon: number;
  avgResolutionTime: number; // days
  memberSatisfactionAvg: number; // 1-5
  escalationsAvoided: number;
  democraticParticipationRate: number; // percentage
  winRate: number; // percentage
  activeParticipation: number; // days active in period
}

/**
 * Calculate organizer impact metrics from case data
 * 
 * Philosophy: These metrics show IMPACT, not productivity.
 * - Cases "handled" means steward was involved, not individual performance
 * - "Won" means member got a positive outcome, not steward success rate
 * - Resolution time is about system efficiency, not speed pressure
 * - Satisfaction is about member experience, not steward rating
 */
export function calculateOrganizerImpact(
  input: ImpactCalculationInput
): OrganizerImpact {
  const metrics = calculateMetrics(input.casesData);

  return {
    id: `impact-${input.organizerId}-${input.periodStart.getTime()}`,
    userId: input.organizerId,
    organizationId: input.organizationId,
    casesHandled: metrics.casesHandled,
    casesWon: metrics.casesWon,
    avgResolutionTime: metrics.avgResolutionTime,
    memberSatisfactionAvg: metrics.memberSatisfactionAvg,
    escalationsAvoided: metrics.escalationsAvoided,
    democraticParticipationRate: metrics.democraticParticipationRate,
    recognitionEvents: input.recognitionEvents || [],
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Calculate detailed metrics from case data
 */
function calculateMetrics(
  casesData: ImpactCalculationInput['casesData']
): ImpactMetrics {
  const totalCases = casesData.length;
  
  if (totalCases === 0) {
    return {
      casesHandled: 0,
      casesWon: 0,
      avgResolutionTime: 0,
      memberSatisfactionAvg: 0,
      escalationsAvoided: 0,
      democraticParticipationRate: 0,
      winRate: 0,
      activeParticipation: 0,
    };
  }

  // Cases won = resolved with positive outcome
  const resolvedCases = casesData.filter((c) => c.status === 'resolved');
  const casesWon = resolvedCases.length;

  // Average resolution time (only for resolved cases)
  const resolutionTimes = resolvedCases
    .filter((c) => c.resolvedAt)
    .map((c) => {
      const days = Math.ceil(
        (new Date(c.resolvedAt!).getTime() - new Date(c.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return days;
    });

  const avgResolutionTime =
    resolutionTimes.length > 0
      ? resolutionTimes.reduce((sum, t) => sum + t, 0) / resolutionTimes.length
      : 0;

  // Member satisfaction average
  const satisfactionScores = casesData
    .filter((c) => c.memberSatisfaction !== undefined)
    .map((c) => c.memberSatisfaction!);

  const memberSatisfactionAvg =
    satisfactionScores.length > 0
      ? satisfactionScores.reduce((sum, s) => sum + s, 0) / satisfactionScores.length
      : 0;

  // Escalations avoided = cases NOT escalated
  const escalationsAvoided = casesData.filter((c) => !c.escalated).length;

  // Democratic participation rate
  const totalDemocraticActions = casesData.reduce(
    (sum, c) => sum + (c.democraticActions || 0),
    0
  );
  const democraticParticipationRate =
    totalCases > 0 ? (totalDemocraticActions / totalCases) * 100 : 0;

  // Win rate
  const winRate = totalCases > 0 ? (casesWon / totalCases) * 100 : 0;

  return {
    casesHandled: totalCases,
    casesWon,
    avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
    memberSatisfactionAvg: Math.round(memberSatisfactionAvg * 10) / 10,
    escalationsAvoided,
    democraticParticipationRate: Math.round(democraticParticipationRate),
    winRate: Math.round(winRate),
    activeParticipation: 0, // Calculated separately from activity logs
  };
}

/**
 * Generate recognition events based on impact metrics
 * 
 * Philosophy: Recognition is about CELEBRATION, not competition.
 * - Triggered automatically when meaningful milestones are reached
 * - Focus on member outcomes, not steward productivity
 * - Never compare stewards to each other
 */
export function generateRecognitionEvents(
  impact: OrganizerImpact,
  previousImpact?: OrganizerImpact
): RecognitionEvent[] {
  const events: RecognitionEvent[] = [];

  // Milestone: First case win
  if (impact.casesWon === 1 && (!previousImpact || previousImpact.casesWon === 0)) {
    events.push({
      type: 'case-win',
      description: 'First case successfully resolved!',
      date: new Date(),
      metadata: { milestone: 'first-win' },
    });
  }

  // Milestone: 10, 25, 50, 100 cases handled
  const milestones = [10, 25, 50, 100];
  for (const milestone of milestones) {
    if (
      impact.casesHandled >= milestone &&
      (!previousImpact || previousImpact.casesHandled < milestone)
    ) {
      events.push({
        type: 'milestone',
        description: `Supported ${milestone} members through the grievance process`,
        date: new Date(),
        metadata: { milestone: `cases-${milestone}` },
      });
    }
  }

  // Recognition: High member satisfaction (>4.5 average over 10+ cases)
  if (
    impact.casesHandled >= 10 &&
    impact.memberSatisfactionAvg >= 4.5 &&
    (!previousImpact || previousImpact.memberSatisfactionAvg < 4.5)
  ) {
    events.push({
      type: 'member-feedback',
      description: 'Consistently excellent member satisfaction ratings',
      date: new Date(),
      metadata: { avgSatisfaction: impact.memberSatisfactionAvg },
    });
  }

  // Recognition: Strong case outcomes (>75% win rate over 20+ cases)
  if (
    impact.casesHandled >= 20 &&
    impact.casesWon / impact.casesHandled >= 0.75 &&
    (!previousImpact || previousImpact.casesWon / previousImpact.casesHandled < 0.75)
  ) {
    events.push({
      type: 'case-win',
      description: 'Strong track record of positive member outcomes',
      date: new Date(),
      metadata: { winRate: Math.round((impact.casesWon / impact.casesHandled) * 100) },
    });
  }

  // Recognition: Democratic engagement champion (>80% participation rate over 15+ cases)
  if (
    impact.casesHandled >= 15 &&
    impact.democraticParticipationRate >= 80 &&
    (!previousImpact || previousImpact.democraticParticipationRate < 80)
  ) {
    events.push({
      type: 'milestone',
      description: 'Exceptional at engaging members in democratic processes',
      date: new Date(),
      metadata: { participationRate: impact.democraticParticipationRate },
    });
  }

  return events;
}

/**
 * Compare impact across time periods (for personal growth, NOT competition)
 */
export function compareImpactPeriods(
  current: OrganizerImpact,
  previous: OrganizerImpact
): {
  metric: string;
  currentValue: number;
  previousValue: number;
  change: number;
  changePercent: number;
  improving: boolean;
}[] {
  const comparisons = [
    {
      metric: 'Cases Handled',
      current: current.casesHandled,
      previous: previous.casesHandled,
    },
    {
      metric: 'Cases Won',
      current: current.casesWon,
      previous: previous.casesWon,
    },
    {
      metric: 'Avg Resolution Time (days)',
      current: current.avgResolutionTime,
      previous: previous.avgResolutionTime,
      lowerIsBetter: true,
    },
    {
      metric: 'Member Satisfaction',
      current: current.memberSatisfactionAvg,
      previous: previous.memberSatisfactionAvg,
    },
    {
      metric: 'Democratic Participation Rate',
      current: current.democraticParticipationRate,
      previous: previous.democraticParticipationRate,
    },
  ];

  return comparisons.map((comp) => {
    const change = comp.current - comp.previous;
    const changePercent =
      comp.previous !== 0 ? (change / comp.previous) * 100 : 0;
    const improving = comp.lowerIsBetter ? change < 0 : change > 0;

    return {
      metric: comp.metric,
      currentValue: comp.current,
      previousValue: comp.previous,
      change,
      changePercent: Math.round(changePercent),
      improving,
    };
  });
}

/**
 * Get impact summary for display
 */
export function getImpactSummary(impact: OrganizerImpact): {
  headline: string;
  highlights: string[];
  areasForGrowth: string[];
} {
  const highlights: string[] = [];
  const areasForGrowth: string[] = [];

  // Highlights
  if (impact.casesWon > 0) {
    highlights.push(
      `Helped ${impact.casesWon} member${impact.casesWon > 1 ? 's' : ''} achieve positive outcomes`
    );
  }

  if (impact.memberSatisfactionAvg >= 4.0) {
    highlights.push(
      `Strong member satisfaction (${impact.memberSatisfactionAvg.toFixed(1)}/5.0)`
    );
  }

  if (impact.democraticParticipationRate >= 60) {
    highlights.push(
      `Excellent democratic engagement (${impact.democraticParticipationRate}% participation)`
    );
  }

  if (impact.avgResolutionTime > 0 && impact.avgResolutionTime <= 30) {
    highlights.push(
      `Efficient case resolution (avg ${Math.round(impact.avgResolutionTime)} days)`
    );
  }

  // Areas for growth
  if (impact.memberSatisfactionAvg < 3.5 && impact.casesHandled >= 5) {
    areasForGrowth.push(
      'Consider reaching out to members for feedback on their experience'
    );
  }

  if (impact.democraticParticipationRate < 40 && impact.casesHandled >= 10) {
    areasForGrowth.push(
      'Opportunity to increase member engagement in democratic processes'
    );
  }

  const winRate = impact.casesHandled > 0 ? impact.casesWon / impact.casesHandled : 0;
  if (winRate < 0.5 && impact.casesHandled >= 10) {
    areasForGrowth.push(
      'Many cases ending without clear wins—consider case strategy consultation'
    );
  }

  // Generate headline
  let headline = 'Making a Difference';
  if (impact.casesWon >= 50) {
    headline = 'Experienced Advocate';
  } else if (impact.casesWon >= 25) {
    headline = 'Strong Track Record';
  } else if (impact.casesWon >= 10) {
    headline = 'Building Momentum';
  } else if (impact.casesWon >= 1) {
    headline = 'Getting Started';
  }

  return {
    headline,
    highlights: highlights.length > 0 ? highlights : ['Getting started—every case matters'],
    areasForGrowth,
  };
}
