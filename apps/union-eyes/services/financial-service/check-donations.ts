/**
 * Check Donations Table Structure
 */

import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require', max: 1 });

async function main() {
const columns = await sql`
    SELECT column_name, data_type, character_maximum_length, numeric_precision, numeric_scale
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'donations'
    ORDER BY ordinal_position
  `;
columns.forEach(col => {
});
  
  await sql.end();
}

main();
