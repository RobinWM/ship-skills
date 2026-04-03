#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const rootFlag = args.indexOf('--root');
const root = rootFlag >= 0 ? path.resolve(args[rootFlag + 1]) : path.resolve('skills');
const dryRun = args.includes('--dry-run');
const changelogFlag = args.indexOf('--changelog');
const tagsFlag = args.indexOf('--tags');
const bumpFlag = args.indexOf('--bump');
const passthrough = args.filter((arg, index) => {
  if (rootFlag >= 0 && (index === rootFlag || index === rootFlag + 1)) return false;
  return true;
});

if (!fs.existsSync(root)) {
  console.error(`Skills root not found: ${root}`);
  process.exit(1);
}

const skills = fs.readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (skills.length === 0) {
  console.log('No skills found.');
  process.exit(0);
}

console.log(`Found ${skills.length} skill(s):`);
for (const skill of skills) {
  console.log(`- ${skill}`);
}

const whoami = spawnSync('clawhub', ['whoami'], { encoding: 'utf8' });
if (whoami.status !== 0) {
  if (dryRun) {
    console.log('\nNot logged in to ClawHub. Dry run stops at local discovery.');
    process.exit(0);
  }
  console.error('\nNot logged in to ClawHub. Run `clawhub login` first.');
  process.exit(1);
}

console.log(`\nClawHub auth OK: ${whoami.stdout.trim()}`);

const syncArgs = ['sync', '--root', root];
for (const arg of passthrough) syncArgs.push(arg);
if (!passthrough.includes('--all') && !dryRun) syncArgs.push('--all');
if (changelogFlag < 0 && !dryRun) syncArgs.push('--changelog', 'Repository sync release');
if (tagsFlag < 0) syncArgs.push('--tags', 'latest,ship');
if (bumpFlag < 0 && !dryRun) syncArgs.push('--bump', 'patch');

console.log(`\n> clawhub ${syncArgs.join(' ')}`);
const result = spawnSync('clawhub', syncArgs, { stdio: 'inherit' });
process.exit(result.status ?? 1);
