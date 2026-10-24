// Fails if any tracked file is over 5 MB. Run in CI and by the pre-commit hook.
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';

const LIMIT = 5 * 1024 * 1024;
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);
const big = files.filter((f) => {
  try {
    return statSync(f).size > LIMIT;
  } catch (err) {
    if (err.code === 'ENOENT') return false; // deleted in the working tree
    throw err;
  }
});
if (big.length) {
  console.error(`Files over 5 MB must not be committed:\n  ${big.join('\n  ')}`);
  process.exit(1);
}
console.log(`${files.length} files checked, none over 5 MB.`);
