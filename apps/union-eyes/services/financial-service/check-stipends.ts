import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();
const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

async function check() {
  const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'stipend_disbursements' ORDER BY ordinal_position`;
await sql.end();
}

check();
