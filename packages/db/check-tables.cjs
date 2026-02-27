const pg = require('pg');
const c = new pg.Client(process.env.DATABASE_URL);

async function main() {
  await c.connect();
  
  const r1 = await c.query("SELECT count(*) FROM pg_tables WHERE schemaname='public'");
  console.log(r1.rows[0].count + ' tables total');
  
  const r2 = await c.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE '%org%' ORDER BY tablename");
  console.log('org-related tables:');
  r2.rows.forEach(t => console.log('  - ' + t.tablename));
  
  const r3 = await c.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('organizations','dues_rules','organization_sharing_settings') ORDER BY tablename");
  console.log('seed-needed tables:');
  r3.rows.forEach(t => console.log('  - ' + t.tablename));
  
  await c.end();
}

main().catch(e => { console.error(e.message); c.end(); });
