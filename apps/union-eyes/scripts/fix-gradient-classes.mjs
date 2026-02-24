/**
 * Fix Tailwind v4 deprecated gradient classes.
 * bg-gradient-to-* → bg-linear-to-*
 */
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const files = execSync('git ls-files "*.tsx" "*.ts"', { encoding: 'utf-8' })
  .trim()
  .split('\n')
  .filter(Boolean);

let updated = 0;
for (const file of files) {
  try {
    const content = readFileSync(file, 'utf-8');
    if (content.includes('bg-gradient-to-')) {
      const newContent = content.replaceAll('bg-gradient-to-', 'bg-linear-to-');
      writeFileSync(file, newContent);
      console.log(`Updated: ${file}`);
      updated++;
    }
  } catch {
    // File may not exist on disk (e.g. deleted)
  }
}
console.log(`\nDone. Updated ${updated} files.`);
