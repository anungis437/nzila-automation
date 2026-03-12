import { db } from '@/db/db';
import { organizationMembers } from '@/db/schema-organizations';

const CAPE_ORG_ID = '885aa4e0-5dc1-45bf-ad32-86477868e8ea';
const admins = [
  'user_35NlrrNcfTv0DMh2kzBHyXZRtpb',
  'user_37Zo7OrvP4jy0J0MU5APfkDtE2V',
];

async function main() {
  for (const userId of admins) {
    await db
      .insert(organizationMembers)
      .values({
        organizationId: CAPE_ORG_ID,
        userId,
        name: `Platform Admin (${userId.slice(0, 12)})`,
        email: `admin+${userId.slice(5, 15)}@nzila.io`,
        role: 'admin',
        isPrimary: false,
      })
      .onConflictDoNothing();
    console.log(`Created CAPE membership for ${userId}`);
  }
  process.exit(0);
}

main();
