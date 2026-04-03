#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const hasFlag = (flag) => args.includes(flag);

const root = path.resolve(getArg('--root') ?? 'skills');
const dryRun = hasFlag('--dry-run');
const changelog = getArg('--changelog') ?? 'Repository sync release';
const tags = getArg('--tags') ?? 'latest,ship';
const bump = getArg('--bump') ?? 'patch';

if (!fs.existsSync(root)) {
  console.error(`Skills root not found: ${root}`);
  process.exit(1);
}

const skillDirs = fs.readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (skillDirs.length === 0) {
  console.log('No skills found.');
  process.exit(0);
}

const parseSkillMeta = (skillName) => {
  const skillFile = path.join(root, skillName, 'SKILL.md');
  const raw = fs.readFileSync(skillFile, 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  const frontmatter = match?.[1] ?? '';
  const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim() ?? skillName;
  const version = frontmatter.match(/^version:\s*(.+)$/m)?.[1]?.trim() ?? '0.1.0';
  return {
    skillName,
    dir: path.join(root, skillName),
    slug: name,
    displayName: name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    version,
  };
};

const bumpVersion = (version, type) => {
  const [major, minor, patch] = version.split('.').map((n) => Number.parseInt(n, 10) || 0);
  if (type === 'major') return `${major + 1}.0.0`;
  if (type === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
};

const inspectLatestVersion = (slug) => {
  const result = spawnSync('clawhub', ['inspect', slug], { encoding: 'utf8' });
  if (result.status !== 0) return null;
  const latest = result.stdout.match(/Latest:\s*([0-9]+\.[0-9]+\.[0-9]+)/)?.[1];
  return latest ?? null;
};

const whoami = spawnSync('clawhub', ['whoami'], { encoding: 'utf8' });
if (whoami.status !== 0) {
  if (dryRun) {
    console.log('Not logged in to ClawHub. Dry run stops at local discovery.');
    process.exit(0);
  }
  console.error('Not logged in to ClawHub. Run `clawhub login` first.');
  process.exit(1);
}

console.log(`ClawHub auth OK: ${whoami.stdout.trim()}`);
console.log(`Found ${skillDirs.length} repo skill(s):`);

const plans = skillDirs.map(parseSkillMeta).map((meta) => {
  const latest = inspectLatestVersion(meta.slug);
  const nextVersion = latest ? bumpVersion(latest, bump) : meta.version;
  return { ...meta, latest, nextVersion };
});

for (const plan of plans) {
  console.log(`- ${plan.slug}: ${plan.latest ? `${plan.latest} -> ${plan.nextVersion}` : `new @ ${plan.nextVersion}`}`);
}

if (dryRun) {
  console.log('\nDry run only. No publish step executed.');
  process.exit(0);
}

for (const plan of plans) {
  const cmd = [
    'publish',
    plan.dir,
    '--slug', plan.slug,
    '--name', plan.displayName,
    '--version', plan.nextVersion,
    '--changelog', changelog,
    '--tags', tags,
  ];
  console.log(`\n> clawhub ${cmd.join(' ')}`);
  const result = spawnSync('clawhub', cmd, { stdio: 'inherit' });
  if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1);
}
