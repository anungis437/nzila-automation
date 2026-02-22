from django.db import connection
cur = connection.cursor()
for tbl in ['claims', 'grievances', 'organization_members']:
    cur.execute(
        f"SELECT column_name FROM information_schema.columns "
        f"WHERE table_name='{tbl}' AND table_schema='public' ORDER BY ordinal_position"
    )
    print(f"{tbl}: {[r[0] for r in cur.fetchall()]}")
