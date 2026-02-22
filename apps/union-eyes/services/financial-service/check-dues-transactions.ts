import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = postgres(DATABASE_URL, {
  ssl: 'require',
  max: 1,
});

async function checkDuesTransactions() {
  try {
    // Get all columns
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'dues_transactions'
      ORDER BY ordinal_position;
    `;
columns.forEach(col => {
});
    
    // Check for amount-related columns
    const amountCols = columns.filter(c => c.column_name.includes('amount'));
amountCols.forEach(col => {
});
    
  } catch (error) {
} finally {
    await sql.end();
  }
}

checkDuesTransactions();
