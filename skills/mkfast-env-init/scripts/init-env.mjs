import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';

const REQUIRED_PROCESS_ENV_KEYS = [
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_API_TOKEN',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
];
const OPTIONAL_PROCESS_ENV_KEYS = ['DISCORD_WEBHOOK_URL', 'FAL_KEY'];
const FIXED_ENV_VALUES = {
  VITE_PLAUSIBLE_SCRIPT: 'https://plausible.allinaigc.org/js/script.js',
};
const PACKAGE_JSON_PATH = path.resolve('package.json');
const WRANGLER_CONFIG_PATH = path.resolve('wrangler.jsonc');
const ENV_LOCAL_PATH = path.resolve('.env.local');
const ENV_PRODUCTION_PATH = path.resolve('.env.production');

function getCurrentFolderName() {
  return path.basename(process.cwd());
}

function getPnpmExecutable() {
  return 'pnpm';
}

function quoteCommandArg(arg) {
  if (process.platform === 'win32') {
    return `"${arg.replace(/"/g, '""')}"`;
  }

  return `'${arg.replace(/'/g, `'\\''`)}'`;
}

function runPnpmCommand(args, options = {}) {
  if (process.platform === 'win32') {
    const command = `& ${[getPnpmExecutable(), ...args]
      .map(quoteCommandArg)
      .join(' ')}`;
    return execFileSync(
      'powershell',
      ['-NoProfile', '-Command', command],
      {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
      }
    );
  }

  return execFileSync(getPnpmExecutable(), args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
}

function stripBom(content) {
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
}

function getArgValue(name) {
  const args = process.argv.slice(2);

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (!arg) continue;

    if (arg === name) {
      return args[index + 1];
    }

    if (arg.startsWith(`${name}=`)) {
      return arg.slice(name.length + 1);
    }
  }

  return undefined;
}

function hasArg(name) {
  const args = process.argv.slice(2);

  return args.some((arg) => arg === name);
}

function parseEnvKeys(content) {
  const keys = new Set();

  for (const line of stripBom(content).split(/\r?\n/)) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) {
      keys.add(match[1]);
    }
  }

  return keys;
}

function replaceEnvValue(content, key, value) {
  const line = `${key}='${value}'`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');

  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }

  const prefix = content.endsWith('\n') ? '' : '\n';
  return `${content}${prefix}${line}\n`;
}

function getEnvValue(content, key) {
  const pattern = new RegExp(`^${key}=(.*)$`, 'm');
  const match = stripBom(content).match(pattern);

  if (!match) {
    return undefined;
  }

  const rawValue = match[1]?.trim() ?? '';
  if (
    (rawValue.startsWith("'") && rawValue.endsWith("'")) ||
    (rawValue.startsWith('"') && rawValue.endsWith('"'))
  ) {
    return rawValue.slice(1, -1);
  }

  return rawValue;
}

function getEnvFileValue(filePath, key) {
  if (!fs.existsSync(filePath)) {
    return '';
  }

  const content = fs.readFileSync(filePath, 'utf8');
  return getEnvValue(content, key) ?? '';
}

function getJsonStringValue(content, key) {
  const pattern = new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`);
  return content.match(pattern)?.[1];
}

function readWindowsEnvValue(key, scope) {
  try {
    const escapedKey = key.replace(/'/g, "''");
    const value = execFileSync(
      'powershell',
      [
        '-NoProfile',
        '-Command',
        `[Environment]::GetEnvironmentVariable('${escapedKey}', '${scope}')`,
      ],
      { encoding: 'utf8' }
    ).trim();

    return value;
  } catch {
    return '';
  }
}

function getRuntimeEnvValue(key) {
  const processValue = process.env[key]?.trim();

  if (processValue) {
    return processValue;
  }

  if (process.platform !== 'win32') {
    return '';
  }

  const userValue = readWindowsEnvValue(key, 'User');
  if (userValue) {
    return userValue;
  }

  return readWindowsEnvValue(key, 'Machine');
}

function getRequiredRuntimeEnvValues(keys, optionName) {
  const envValues = Object.fromEntries(
    keys.map((key) => [key, getRuntimeEnvValue(key)])
  );
  const missingKeys = keys.filter((key) => !envValues[key]);

  if (missingKeys.length > 0) {
    console.error(
      `Missing required process env: ${missingKeys.join(', ')}. ` +
        `Export them before running template-env-init with ${optionName}.`
    );
    process.exit(1);
  }

  return envValues;
}

function normalizeDomainInput(domain) {
  const trimmedDomain = domain.trim();

  if (!trimmedDomain) {
    console.error('Missing required value: --domain');
    process.exit(1);
  }

  if (trimmedDomain.startsWith('http://')) {
    const url = new URL(trimmedDomain);
    return {
      baseUrl: trimmedDomain,
      pattern: url.host,
    };
  }

  if (trimmedDomain.startsWith('https://')) {
    const url = new URL(trimmedDomain);
    return {
      baseUrl: trimmedDomain,
      pattern: url.host,
    };
  }

  return {
    baseUrl: `https://${trimmedDomain}`,
    pattern: trimmedDomain,
  };
}

function ensureEnvFile(targetPath, sourcePath) {
  if (fs.existsSync(targetPath)) {
    return;
  }

  if (!fs.existsSync(sourcePath)) {
    console.error(`Source env file not found: ${sourcePath}`);
    process.exit(1);
  }

  const sourceContent = fs.readFileSync(sourcePath, 'utf8');
  fs.writeFileSync(targetPath, sourceContent, 'utf8');
  console.log(
    `Created ${path.basename(targetPath)} from ${path.basename(sourcePath)}.`
  );
}

function updateProjectMetadata(projectName) {
  const normalizedProjectName = (projectName ?? getCurrentFolderName()).trim();

  if (!normalizedProjectName) {
    console.error('Unable to determine project name from current folder.');
    process.exit(1);
  }

  if (!fs.existsSync(PACKAGE_JSON_PATH)) {
    console.error(`package.json not found: ${PACKAGE_JSON_PATH}`);
    process.exit(1);
  }

  if (!fs.existsSync(WRANGLER_CONFIG_PATH)) {
    console.error(`wrangler.jsonc not found: ${WRANGLER_CONFIG_PATH}`);
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  packageJson.name = normalizedProjectName;
  fs.writeFileSync(
    PACKAGE_JSON_PATH,
    `${JSON.stringify(packageJson, null, 2)}\n`,
    'utf8'
  );

  const wranglerContent = fs.readFileSync(WRANGLER_CONFIG_PATH, 'utf8');
  const updatedWranglerContent = wranglerContent
    .replace(/"name":\s*"[^"]+"/, `"name": "${normalizedProjectName}"`)
    .replace(
      /"database_name":\s*"[^"]+"/,
      `"database_name": "${normalizedProjectName}"`
    );

  fs.writeFileSync(WRANGLER_CONFIG_PATH, updatedWranglerContent, 'utf8');
  console.log(
    `Updated project metadata in package.json and wrangler.jsonc for ${normalizedProjectName}.`
  );
}

function updateDomainMetadata(domain, sourcePath) {
  const normalizedDomain = normalizeDomainInput(domain);

  if (!fs.existsSync(WRANGLER_CONFIG_PATH)) {
    console.error(`wrangler.jsonc not found: ${WRANGLER_CONFIG_PATH}`);
    process.exit(1);
  }

  ensureEnvFile(ENV_PRODUCTION_PATH, sourcePath);

  let envProductionContent = fs.readFileSync(ENV_PRODUCTION_PATH, 'utf8');
  envProductionContent = replaceEnvValue(
    envProductionContent,
    'VITE_BASE_URL',
    normalizedDomain.baseUrl
  );
  fs.writeFileSync(ENV_PRODUCTION_PATH, envProductionContent, 'utf8');

  const wranglerContent = fs.readFileSync(WRANGLER_CONFIG_PATH, 'utf8');
  const updatedWranglerContent = wranglerContent.replace(
    /"pattern":\s*"[^"]+"/,
    `"pattern": "${normalizedDomain.pattern}"`
  );

  fs.writeFileSync(WRANGLER_CONFIG_PATH, updatedWranglerContent, 'utf8');
  console.log(
    `Updated .env.production and wrangler.jsonc for domain ${normalizedDomain.pattern}.`
  );
}

function fillRequiredProcessEnv(targetPath) {
  const envValues = getRequiredRuntimeEnvValues(
    REQUIRED_PROCESS_ENV_KEYS,
    '--fill-cloudflare'
  );
  const optionalEnvValues = Object.fromEntries(
    OPTIONAL_PROCESS_ENV_KEYS.map((key) => [key, getRuntimeEnvValue(key)])
  );

  let targetContent = fs.readFileSync(targetPath, 'utf8');

  for (const key of REQUIRED_PROCESS_ENV_KEYS) {
    const value = envValues[key];

    if (!value) continue;
    targetContent = replaceEnvValue(targetContent, key, value);
  }

  for (const key of OPTIONAL_PROCESS_ENV_KEYS) {
    const value = optionalEnvValues[key];

    if (!value) continue;
    targetContent = replaceEnvValue(targetContent, key, value);
  }

  fs.writeFileSync(targetPath, targetContent, 'utf8');
  console.log(
    `Filled ${path.basename(targetPath)} with required credentials from process env.`
  );
}

function updateDatabaseIdEverywhere(databaseId, sourcePath) {
  if (!fs.existsSync(WRANGLER_CONFIG_PATH)) {
    console.error(`wrangler.jsonc not found: ${WRANGLER_CONFIG_PATH}`);
    process.exit(1);
  }

  ensureEnvFile(ENV_LOCAL_PATH, sourcePath);
  ensureEnvFile(ENV_PRODUCTION_PATH, sourcePath);

  for (const envPath of [ENV_LOCAL_PATH, ENV_PRODUCTION_PATH]) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = replaceEnvValue(
      envContent,
      'CLOUDFLARE_DATABASE_ID',
      databaseId
    );
    fs.writeFileSync(envPath, envContent, 'utf8');
  }

  const wranglerContent = fs.readFileSync(WRANGLER_CONFIG_PATH, 'utf8');
  const updatedWranglerContent = wranglerContent.replace(
    /"database_id":\s*"[^"]*"/,
    `"database_id": "${databaseId}"`
  );
  fs.writeFileSync(WRANGLER_CONFIG_PATH, updatedWranglerContent, 'utf8');
}

function createD1Database(sourcePath) {
  if (!fs.existsSync(WRANGLER_CONFIG_PATH)) {
    console.error(`wrangler.jsonc not found: ${WRANGLER_CONFIG_PATH}`);
    process.exit(1);
  }

  const wranglerContent = fs.readFileSync(WRANGLER_CONFIG_PATH, 'utf8');
  const databaseName = getJsonStringValue(wranglerContent, 'database_name');

  if (!databaseName) {
    console.error('Unable to determine database_name from wrangler.jsonc.');
    process.exit(1);
  }

  const runtimeEnv = getRequiredRuntimeEnvValues(
    ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN'],
    '--create-d1'
  );
  const wranglerEnv = {
    ...process.env,
    CLOUDFLARE_ACCOUNT_ID: runtimeEnv.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_API_TOKEN: runtimeEnv.CLOUDFLARE_API_TOKEN,
  };
  const tempDir = fs.mkdtempSync(
    path.join(process.cwd(), '.tmp-template-env-init-d1-')
  );
  const tempConfigPath = path.join(tempDir, 'wrangler.temp.jsonc');

  try {
    fs.writeFileSync(tempConfigPath, '{}\n', 'utf8');
    runPnpmCommand(
      [
        'exec',
        'wrangler',
        'd1',
        'create',
        databaseName,
        '--config',
        tempConfigPath,
        '--binding',
        'DB',
        '--update-config',
      ],
      {
        env: wranglerEnv,
      }
    );

    const tempConfigContent = fs.readFileSync(tempConfigPath, 'utf8');
    const databaseId = getJsonStringValue(tempConfigContent, 'database_id');

    if (!databaseId) {
      throw new Error('database_id not found in temporary Wrangler config.');
    }

    updateDatabaseIdEverywhere(databaseId, sourcePath);
    console.log(
      `Created remote D1 database ${databaseName} and filled CLOUDFLARE_DATABASE_ID in env files and wrangler.jsonc.`
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred.';

    if (message.includes('A database with that name already exists')) {
      try {
        const output = runPnpmCommand(['exec', 'wrangler', 'd1', 'list', '--json'], {
          env: wranglerEnv,
        });
        const databases = JSON.parse(output);
        const existingDatabase = Array.isArray(databases)
          ? databases.find((database) => database?.name === databaseName)
          : undefined;
        const databaseId =
          existingDatabase &&
          typeof existingDatabase === 'object' &&
          'uuid' in existingDatabase &&
          typeof existingDatabase.uuid === 'string'
            ? existingDatabase.uuid
            : '';

        if (!databaseId) {
          throw new Error(
            `Existing database ${databaseName} was found by name lookup, but no uuid was returned.`
          );
        }

        updateDatabaseIdEverywhere(databaseId, sourcePath);
        console.log(
          `Reused existing remote D1 database ${databaseName} and filled CLOUDFLARE_DATABASE_ID in env files and wrangler.jsonc.`
        );
        return;
      } catch (fallbackError) {
        const fallbackMessage =
          fallbackError instanceof Error
            ? fallbackError.message
            : 'Unknown fallback error occurred.';
        console.error(
          `Failed to reuse existing remote D1 database ${databaseName}: ${fallbackMessage}`
        );
        process.exit(1);
      }
    }

    console.error(
      `Failed to create remote D1 database ${databaseName}: ${message}`
    );
    process.exit(1);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function syncDeploymentSecrets() {
  if (!fs.existsSync(PACKAGE_JSON_PATH)) {
    console.error(`package.json not found: ${PACKAGE_JSON_PATH}`);
    process.exit(1);
  }

  if (!fs.existsSync(ENV_PRODUCTION_PATH)) {
    console.error(
      `${ENV_PRODUCTION_PATH} not found. Initialize .env.production before syncing secrets.`
    );
    process.exit(1);
  }

  try {
    runPnpmCommand(['sync-github-secrets']);
    runPnpmCommand(['sync-worker-secrets']);
    console.log(
      'Synced GitHub Actions secrets and Cloudflare Worker secrets from repository configuration.'
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred.';
    console.error(`Failed to sync deployment secrets: ${message}`);
    process.exit(1);
  }
}

function runDbMigrateLocal() {
  try {
    runPnpmCommand(['db:migrate:local']);
    console.log('Applied D1 migrations to the local database with pnpm db:migrate:local.');
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred.';
    console.error(`Failed to run pnpm db:migrate:local: ${message}`);
    process.exit(1);
  }
}

function runDbMigrateRemote() {
  const accountId =
    getRuntimeEnvValue('CLOUDFLARE_ACCOUNT_ID') ||
    getEnvFileValue(ENV_PRODUCTION_PATH, 'CLOUDFLARE_ACCOUNT_ID') ||
    getEnvFileValue(ENV_LOCAL_PATH, 'CLOUDFLARE_ACCOUNT_ID');
  const apiToken =
    getRuntimeEnvValue('CLOUDFLARE_API_TOKEN') ||
    getEnvFileValue(ENV_PRODUCTION_PATH, 'CLOUDFLARE_API_TOKEN') ||
    getEnvFileValue(ENV_LOCAL_PATH, 'CLOUDFLARE_API_TOKEN');
  const databaseId =
    getEnvFileValue(ENV_PRODUCTION_PATH, 'CLOUDFLARE_DATABASE_ID') ||
    getEnvFileValue(ENV_LOCAL_PATH, 'CLOUDFLARE_DATABASE_ID');

  const missingKeys = [];
  if (!accountId) missingKeys.push('CLOUDFLARE_ACCOUNT_ID');
  if (!apiToken) missingKeys.push('CLOUDFLARE_API_TOKEN');
  if (!databaseId) missingKeys.push('CLOUDFLARE_DATABASE_ID');

  if (missingKeys.length > 0) {
    console.error(
      `Missing required values for db:migrate:remote: ${missingKeys.join(', ')}. ` +
        'Populate env files and D1 metadata before running template-env-init with --db-migrate-remote.'
    );
    process.exit(1);
  }

  try {
    runPnpmCommand(['db:migrate:remote'], {
      env: {
        ...process.env,
        CLOUDFLARE_ACCOUNT_ID: accountId,
        CLOUDFLARE_API_TOKEN: apiToken,
        CLOUDFLARE_DATABASE_ID: databaseId,
      },
    });
    console.log(
      'Applied D1 migrations to the remote database with pnpm db:migrate:remote.'
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred.';
    console.error(`Failed to run pnpm db:migrate:remote: ${message}`);
    process.exit(1);
  }
}

function generateBetterAuthSecret() {
  try {
    const output = execSync('openssl rand -base64 32', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const secret = output.trim();

    if (!secret) {
      throw new Error('Generated secret output was empty.');
    }

    return secret;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred.';
    console.error(
      `Failed to generate BETTER_AUTH_SECRET with openssl rand -base64 32: ${message}`
    );
    process.exit(1);
  }
}

function fillBetterAuthSecret(targetPath) {
  let targetContent = fs.readFileSync(targetPath, 'utf8');
  const currentValue = getEnvValue(targetContent, 'BETTER_AUTH_SECRET');

  if (currentValue) {
    console.log(
      `${path.basename(targetPath)} already contains BETTER_AUTH_SECRET.`
    );
    return;
  }

  const secret = generateBetterAuthSecret();
  targetContent = replaceEnvValue(targetContent, 'BETTER_AUTH_SECRET', secret);
  fs.writeFileSync(targetPath, targetContent, 'utf8');
  console.log(
    `Generated and filled BETTER_AUTH_SECRET in ${path.basename(targetPath)}.`
  );
}

function fillFixedEnvValues(targetPath) {
  let targetContent = fs.readFileSync(targetPath, 'utf8');

  for (const [key, value] of Object.entries(FIXED_ENV_VALUES)) {
    targetContent = replaceEnvValue(targetContent, key, value);
  }

  fs.writeFileSync(targetPath, targetContent, 'utf8');
  console.log(
    `Filled ${path.basename(targetPath)} with fixed env values.`
  );
}

const projectName = getArgValue('--project-name');
const domain = getArgValue('--domain');
const explicitSourcePath = getArgValue('--source');
const explicitTargetPath = getArgValue('--target');
const sourcePath = path.resolve(explicitSourcePath ?? '.env.example');
const targetPath = path.resolve(explicitTargetPath ?? '.env.local');
const syncProjectMetadata = hasArg('--sync-project-metadata');
const createD1 = hasArg('--create-d1');
const dbMigrateLocal = hasArg('--db-migrate-local');
const dbMigrateRemote = hasArg('--db-migrate-remote');
const dbMigrateAll = hasArg('--db-migrate-all');
const syncSecrets = hasArg('--sync-secrets');
const metadataOnlyMode =
  (Boolean(projectName) ||
    Boolean(domain) ||
    syncProjectMetadata ||
    createD1 ||
    dbMigrateLocal ||
    dbMigrateRemote ||
    dbMigrateAll ||
    syncSecrets) &&
  !explicitSourcePath &&
  !explicitTargetPath &&
  !hasArg('--fill-cloudflare');

if (projectName || syncProjectMetadata) {
  updateProjectMetadata(projectName);
}

if (domain) {
  updateDomainMetadata(domain, sourcePath);
}

if (createD1) {
  createD1Database(sourcePath);
}

if (dbMigrateLocal || dbMigrateAll) {
  runDbMigrateLocal();
}

if (dbMigrateRemote || dbMigrateAll) {
  runDbMigrateRemote();
}

if (syncSecrets) {
  syncDeploymentSecrets();
}

if (metadataOnlyMode) {
  process.exit(0);
}

if (!fs.existsSync(sourcePath)) {
  console.error(`Source env file not found: ${sourcePath}`);
  process.exit(1);
}

const sourceContent = fs.readFileSync(sourcePath, 'utf8');

if (!fs.existsSync(targetPath)) {
  fs.writeFileSync(targetPath, sourceContent, 'utf8');
  console.log(
    `Created ${path.basename(targetPath)} from ${path.basename(sourcePath)}.`
  );
} else {
  const targetContent = fs.readFileSync(targetPath, 'utf8');
  const sourceKeys = parseEnvKeys(sourceContent);
  const targetKeys = parseEnvKeys(targetContent);
  const missingKeys = [...sourceKeys].filter((key) => !targetKeys.has(key));

  if (missingKeys.length === 0) {
    console.log(
      `${path.basename(targetPath)} already contains all keys from ${path.basename(sourcePath)}.`
    );
  } else {
    const sourceLines = sourceContent.split(/\r?\n/);
    const linesToAppend = [];

    for (const line of sourceLines) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);

      if (match && missingKeys.includes(match[1])) {
        linesToAppend.push(line);
      }
    }

    const prefix = targetContent.endsWith('\n') ? '' : '\n';
    const blockHeader = '\n# Added from .env.example by template-env-init\n';

    fs.writeFileSync(
      targetPath,
      `${targetContent}${prefix}${blockHeader}${linesToAppend.join('\n')}\n`,
      'utf8'
    );

    console.log(
      `Updated ${path.basename(targetPath)} with ${missingKeys.length} missing key(s): ${missingKeys.join(', ')}`
    );
  }
}

if (hasArg('--fill-cloudflare')) {
  fillRequiredProcessEnv(targetPath);
}

fillBetterAuthSecret(targetPath);
fillFixedEnvValues(targetPath);
