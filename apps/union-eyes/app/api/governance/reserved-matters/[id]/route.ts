/**
 * PATCH /api/governance/reserved-matters/[id]
 * Records Class A vote results on a reserved matter.
 */
import { withApi, z } from '@/lib/api/framework';
import { db } from '@/db/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export const PATCH = withApi(
  {
    auth: { required: true, minRole: 'admin' },
    body: z.object({
      votesFor: z.number().int(),
      votesAgainst: z.number().int(),
      abstain: z.number().int().optional(),
    }),
  },
  async ({ body, params }) => {
    const id = params.id;
    await db.execute(sql`
      UPDATE reserved_matter_votes
      SET class_a_votes_for = ${body.votesFor},
          class_a_votes_against = ${body.votesAgainst},
          class_a_abstain = ${body.abstain ?? 0},
          updated_at = NOW()
      WHERE id = ${id}::uuid
    `);
    return { updated: true };
  },
);

