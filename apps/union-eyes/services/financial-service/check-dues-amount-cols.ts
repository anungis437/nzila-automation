import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const sql = postgres(process.env.DATABASE_URL!, {ssl: 'require'});

(async () => { 
  const cols = await sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'dues_transactions' 
    AND column_name LIKE '%amount%' 
    ORDER BY column_name
  `;
  void cols;
  await sql.end();
})();
