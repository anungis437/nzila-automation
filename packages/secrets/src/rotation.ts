/**
 * Secret Rotation Manager
 *
 * Automated secret rotation with evidence trails and notifications.
 */

import { z } from 'zod';

export const RotationPolicySchema = z.object({
  secretName: z.string(),
  rotationIntervalDays: z.number().positive().default(90),
  lastRotated: z.date().optional(),
  nextRotation: z.date().optional(),
  notifyDaysBeforeExpiry: z.number().positive().default(14),
  autoRotate: z.boolean().default(false),
  rotationType: z.enum(['api_key', 'database_password', 'certificate', 'oauth_secret']),
});

export type RotationPolicy = z.infer<typeof RotationPolicySchema>;

export const RotationEventSchema = z.object({
  secretName: z.string(),
  rotationType: z.string(),
  previousVersion: z.string().optional(),
  newVersion: z.string(),
  rotatedAt: z.date(),
  rotatedBy: z.enum(['automatic', 'manual']),
  evidencePackId: z.string().optional(),
  traceId: z.string().optional(),
});

export type RotationEvent = z.infer<typeof RotationEventSchema>;

export class SecretRotationManager {
  private policies: Map<string, RotationPolicy> = new Map();

  registerPolicy(policy: RotationPolicy): void {
    const validated = RotationPolicySchema.parse(policy);
    const nextRotation = validated.lastRotated
      ? new Date(validated.lastRotated.getTime() + validated.rotationIntervalDays * 86_400_000)
      : new Date(Date.now() + validated.rotationIntervalDays * 86_400_000);

    this.policies.set(validated.secretName, {
      ...validated,
      nextRotation,
    });
  }

  /**
   * Check which secrets need rotation or are approaching expiry.
   */
  getRotationStatus(): {
    overdue: RotationPolicy[];
    upcoming: RotationPolicy[];
    healthy: RotationPolicy[];
  } {
    const now = Date.now();
    const overdue: RotationPolicy[] = [];
    const upcoming: RotationPolicy[] = [];
    const healthy: RotationPolicy[] = [];

    for (const policy of this.policies.values()) {
      if (!policy.nextRotation) {
        overdue.push(policy);
        continue;
      }

      const daysUntilRotation = (policy.nextRotation.getTime() - now) / 86_400_000;

      if (daysUntilRotation < 0) {
        overdue.push(policy);
      } else if (daysUntilRotation < policy.notifyDaysBeforeExpiry) {
        upcoming.push(policy);
      } else {
        healthy.push(policy);
      }
    }

    return { overdue, upcoming, healthy };
  }

  /**
   * Record a rotation event for audit compliance.
   */
  recordRotation(event: RotationEvent): RotationEvent {
    const validated = RotationEventSchema.parse(event);
    const policy = this.policies.get(validated.secretName);

    if (policy) {
      policy.lastRotated = validated.rotatedAt;
      policy.nextRotation = new Date(
        validated.rotatedAt.getTime() + policy.rotationIntervalDays * 86_400_000,
      );
    }

    return validated;
  }
}
