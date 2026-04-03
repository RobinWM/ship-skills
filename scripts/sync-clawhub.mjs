#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const rootFlag = args.indexOf('--root');
const root = rootFlag >= 0 ? path.resolve(args[rootFlag + 1]) : path.resolve('skills');
const dryRun = args.includes('--dry-run');

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

if (dryRun) {
  console.log('\nDry run only. No publish step executed.');
  process.exit(0);
}

console.log('\nPublish step not implemented yet. Wire ClawHub publish here when ready.');
