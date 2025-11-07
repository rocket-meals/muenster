import {defineHook} from '@directus/extensions-sdk';
import {
  AppleClientSecretConfig,
  decodeAppleClientSecret,
  generateAppleClientSecret,
  MAX_TOKEN_LIFETIME_SECONDS
} from './apple/generateAppleClientSecret';
import {ActionInitFilterEventHelper} from '../helpers/ActionInitFilterEventHelper';
import {CronHelper} from "../helpers/CronHelper";
import fs from "fs";

const REFRESH_THRESHOLD_SECONDS = 60 * 60 * 24 * 30; // Refresh if expiring within 30 days

function buildConfigFromEnv(): AppleClientSecretConfig | null {
  const teamId = process.env.AUTH_APPLE_HOOK_APPLE_TEAM_ID;
  const clientId = process.env.AUTH_APPLE_CLIENT_ID;
  const keyId = process.env.AUTH_APPLE_HOOK_APPLE_KEY_ID;
  const privateKeyEscaped = process.env.AUTH_APPLE_HOOK_APPLE_PRIVATE_KEY;

  const missing = [
    !clientId && 'AUTH_APPLE_CLIENT_ID',
    !teamId && 'AUTH_APPLE_HOOK_APPLE_TEAM_ID',
    !keyId && 'AUTH_APPLE_HOOK_APPLE_KEY_ID',
    !privateKeyEscaped && 'AUTH_APPLE_HOOK_APPLE_PRIVATE_KEY',
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    console.warn('[AppleSecretRotator] Missing environment variables:', missing.join(', '));
    return null;
  }

  const privateKeyRaw = privateKeyEscaped || '';
  const privateKeyPem = privateKeyRaw.replace(/\\n/g, '\n');

  return {
    teamId: teamId!,
    clientId: clientId!,
    keyId: keyId!,
    privateKey: privateKeyPem!,
    lifetimeSeconds: MAX_TOKEN_LIFETIME_SECONDS,
  };
}

function decodeExpiry(token: string): number | null {
  const decoded = decodeAppleClientSecret(token);
  return decoded?.exp ?? null;
}

function setEnvValue(key: string, value: string) {
  let configPath = process.env.HOST_ENV_FILE_PATH;
  console.log("[AppleSecretRotator] Writing new value to " + configPath);

  // read file from hdd & split if from a linebreak to a array
  const ENV_VARS = fs.readFileSync(process.env.HOST_ENV_FILE_PATH, "utf8").split('\n'); //or use os.EOL

  // find the env we want based on the key
  const target = ENV_VARS.indexOf(ENV_VARS.find((line) => {
    return line.match(new RegExp(key));
  }));

  // replace the key/value with the new value
  ENV_VARS.splice(target, 1, `${key}=${value}`);

  // write everything back to the file system
  console.log("[AppleSecretRotator] Updated " + key + " in " + configPath);
  fs.writeFileSync(process.env.HOST_ENV_FILE_PATH, ENV_VARS.join('\n'));
}

async function refreshSecret(config: AppleClientSecretConfig) {
  try {
    const result = generateAppleClientSecret(config);
    console.log('[AppleSecretRotator] Generated new Apple client secret. Expires at', new Date(result.expiresAt * 1000).toISOString());
    // Store the new token
    await setEnvValue('AUTH_APPLE_CLIENT_SECRET', result.token);
    // Restart the server/container

    //needed to refresh environment variables. server will respawn by pm2
    setTimeout(() => {
      process.exit(0);
    }, 2000);

  } catch (error) {
    console.error('[AppleSecretRotator] Failed to generate Apple client secret:', error);
  }
}

async function ensureSecret(config: AppleClientSecretConfig) {
  const now = Math.floor(Date.now() / 1000);

  const cachedToken = process.env.AUTH_APPLE_CLIENT_SECRET;

  if (cachedToken) {
    const expiresAt = decodeExpiry(cachedToken);
    if (expiresAt) {
      const secondsRemaining = expiresAt - now;
      if (secondsRemaining < REFRESH_THRESHOLD_SECONDS) {
        console.log('[AppleSecretRotator] Loaded Apple client secret from Redis. Expires at', new Date(expiresAt * 1000).toISOString());
        await refreshSecret(config);
      }
      console.log('[AppleSecretRotator] Apple client secret is nearing expiration. Triggering refresh.');
    } else {
      console.log('[AppleSecretRotator] Apple client secret found in Redis, but expiration could not be determined. Triggering refresh.');
      await refreshSecret(config);
    }
  } else {
    console.log('[AppleSecretRotator] No Apple client secret found in Redis. Generating a new one.');
  }

  return;
}

export default defineHook(async ({ init, schedule }) => {
  const config = buildConfigFromEnv();
  if (!config) {
    console.warn('[AppleSecretRotator] Hook disabled due to missing configuration.');
    return;
  }

  const runRefresh = async (reason: string) => {
    console.log(`[AppleSecretRotator] Running Apple client secret refresh check (${reason})...`);
    try {
      await ensureSecret(config);
    } catch (error) {
      console.error(`[AppleSecretRotator] Failed to refresh Apple client secret during ${reason}:`, error);
    }
  };

  init(ActionInitFilterEventHelper.INIT_APP_STARTED, async () => {
    await runRefresh('startup');
  });

  // Run once per day at 02:00 server time.
  schedule(CronHelper.getCronString(CronHelper.EVERY_MINUTE), async () => {
    await runRefresh('check apple token refresh');
  });
});
