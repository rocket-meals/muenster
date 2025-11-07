import {defineHook} from '@directus/extensions-sdk';
import {
  AppleClientSecretConfig,
  decodeAppleClientSecretExpiry,
  generateAppleClientSecret,
  MAX_TOKEN_LIFETIME_SECONDS
} from './apple/generateAppleClientSecret';
import {ActionInitFilterEventHelper} from '../helpers/ActionInitFilterEventHelper';
import {CronHelper} from "../helpers/CronHelper";
import fs from "fs";

const refreshIfExpiringWithinDays = 7; // Refresh if expiring within 7 days
const REFRESH_THRESHOLD_SECONDS = 60 * 60 * 24 * refreshIfExpiringWithinDays;

const HOOK_NAME = 'apple-secret-rotator';

function buildConfigFromEnv(): AppleClientSecretConfig | null {
  const teamId = process.env.AUTH_APPLE_HOOK_APPLE_TEAM_ID;
  const clientId = process.env.AUTH_APPLE_CLIENT_ID;
  const keyId = process.env.AUTH_APPLE_HOOK_APPLE_KEY_ID;
  const privateKeyEscaped = process.env.AUTH_APPLE_HOOK_APPLE_PRIVATE_KEY;
  const hostEnvFilePath = process.env.HOST_ENV_FILE_PATH;

  const missing = [
    !clientId && 'AUTH_APPLE_CLIENT_ID',
    !teamId && 'AUTH_APPLE_HOOK_APPLE_TEAM_ID',
    !keyId && 'AUTH_APPLE_HOOK_APPLE_KEY_ID',
    !privateKeyEscaped && 'AUTH_APPLE_HOOK_APPLE_PRIVATE_KEY',
    !hostEnvFilePath && 'HOST_ENV_FILE_PATH',
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    console.warn('['+HOOK_NAME+'] Missing environment variables:', missing.join(', '));
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

function setEnvValue(key: string, value: string) {
  let configPath = process.env.HOST_ENV_FILE_PATH as string;
  console.log("["+HOOK_NAME+"] Writing new value to " + configPath);
  console.log("Setting " + key + " to " + value.substring(0, 10) + "....");

  // read file from hdd & split if from a linebreak to a array
  const ENV_VARS = fs.readFileSync(configPath, "utf8").split('\n'); //or use os.EOL
  console.log("["+HOOK_NAME+"] Read " + ENV_VARS.length + " lines from " + configPath);

  // find the env we want based on the key
  // @ts-ignore
  const target = ENV_VARS.indexOf(ENV_VARS.find((line) => {
    return line.match(new RegExp(key));
  }));

  // replace the key/value with the new value
  ENV_VARS.splice(target, 1, `${key}=${value}`);

  // write everything back to the file system
  fs.writeFileSync(configPath, ENV_VARS.join('\n'));

  console.log("["+HOOK_NAME+"] Updated " + key + " in " + configPath);
}

// New: load AUTH_APPLE_CLIENT_SECRET synchronously at module load time from host env file
function loadAppleClientSecretFromHostEnvSync() {
  const hostEnvFilePath = process.env.HOST_ENV_FILE_PATH;
  if (!hostEnvFilePath) {
    // No host env file path configured; nothing to do.
    console.log('['+HOOK_NAME+'] HOST_ENV_FILE_PATH not set at module load time. Skipping early secret load.');
    return;
  }

  try {
    const envContent = fs.readFileSync(hostEnvFilePath, 'utf8');
    const lines = envContent.split(/\r?\n/);
    for (const line of lines) {
      if (!line) continue;
      if (line.startsWith('AUTH_APPLE_CLIENT_SECRET=')) {
        const idx = line.indexOf('=');
        const value = idx >= 0 ? line.substring(idx + 1) : '';
        if (value) {
          process.env.AUTH_APPLE_CLIENT_SECRET = value;
          console.log('['+HOOK_NAME+'] (early load) Loaded AUTH_APPLE_CLIENT_SECRET from host env file into runtime environment.');
        } else {
          console.log('['+HOOK_NAME+'] (early load) AUTH_APPLE_CLIENT_SECRET present in host env file but empty.');
        }
        return;
      }
    }
    console.log('['+HOOK_NAME+'] (early load) AUTH_APPLE_CLIENT_SECRET not found in host env file.');
  } catch (err) {
    console.warn('['+HOOK_NAME+'] (early load) Failed to read host env file at', hostEnvFilePath, (err as any)?.message || String(err));
  }
}

// Attempt an early, synchronous load so other modules that read process.env during import get the real secret.
loadAppleClientSecretFromHostEnvSync();

async function refreshSecret(config: AppleClientSecretConfig) {
  try {
    const result = generateAppleClientSecret(config);
    let token = result.token;
    console.log('['+HOOK_NAME+'] Generated new Apple client secret. Expires at', new Date(result.expiresAt * 1000).toISOString());
    // Store the new token into the .env file when the server completly restarts from outside
    await setEnvValue('AUTH_APPLE_CLIENT_SECRET', token);

    // since docker containers cache environment variables on start we need to save it into the runtime env as well
    process.env.AUTH_APPLE_CLIENT_SECRET = token;


    //needed to refresh environment variables. server will respawn by pm2
    setTimeout(() => {
      console.log('['+HOOK_NAME+'] Exiting process to apply new Apple client secret...');
      process.exit(0);
    }, 2000);

  } catch (error) {
    console.error('['+HOOK_NAME+'] Failed to generate Apple client secret:', error);
  }
}

export default defineHook(async ({ init, schedule }) => {
  const config = buildConfigFromEnv();
  if (!config) {
    console.warn('['+HOOK_NAME+'] Hook disabled due to missing configuration.');
    return;
  }

  const checkForRefresh = async (reason: string) => {
    console.log(`[${HOOK_NAME}] Running Apple client secret refresh check (${reason})...`);
    try {

      const now = Math.floor(Date.now() / 1000);

      const appleClientSecret = process.env.AUTH_APPLE_CLIENT_SECRET;

      if (appleClientSecret) {
        const expiresAt = decodeAppleClientSecretExpiry(appleClientSecret);
        console.log('['+HOOK_NAME+'] Decoded Apple client secret expiration raw value:', expiresAt);
        if (expiresAt) {
          const secondsRemaining = expiresAt - now;
          let isNearingExpiry = secondsRemaining < REFRESH_THRESHOLD_SECONDS;
          console.log('['+HOOK_NAME+'] Apple client secret expires at', new Date(expiresAt * 1000).toISOString());
          if (isNearingExpiry) {
            console.log('['+HOOK_NAME+'] Apple client secret is nearing expiration. Triggering refresh.');
            await refreshSecret(config);
            return;
          } else {
            console.log('['+HOOK_NAME+'] Apple client secret is valid. No refresh needed.');
            return;
          }
        } else {
          console.log('['+HOOK_NAME+'] Apple client secret found, but expiration could not be determined. Triggering refresh.');
          await refreshSecret(config);
          return;
        }
      } else {
        console.log('['+HOOK_NAME+'] No Apple client secret found. Generating a new one.');
        await refreshSecret(config);
        return;
      }
    } catch (error) {
      console.error(`[${HOOK_NAME}] Failed to refresh Apple client secret during ${reason}:`, error);
    }
  };

  function readSecretFromHostEnvAndSetToRuntime(event: string) {
    console.log("["+HOOK_NAME+" - Event: "+event+"] Reading Apple client secret from host env file...");

    console.log("CURRENT AUTH_APPLE_CLIENT_SECRET:", process.env.AUTH_APPLE_CLIENT_SECRET ? process.env.AUTH_APPLE_CLIENT_SECRET.substring(0,10) + "..." : "not set");

    const hostEnvFilePath = process.env.HOST_ENV_FILE_PATH;
    if (!hostEnvFilePath) {
      console.warn('['+HOOK_NAME+'] HOST_ENV_FILE_PATH is not set. Cannot read Apple client secret.');
      return;
    }

    const envContent = fs.readFileSync(hostEnvFilePath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      if (line.startsWith('AUTH_APPLE_CLIENT_SECRET=')) {
        const [, value] = line.split('=');
        process.env.AUTH_APPLE_CLIENT_SECRET = value;
        console.log('['+HOOK_NAME+'] Loaded AUTH_APPLE_CLIENT_SECRET from host env file into runtime environment.');
        return;
      }
    }
    console.warn('['+HOOK_NAME+'] AUTH_APPLE_CLIENT_SECRET not found in host env file.');
  }

  /**
   * As Docker containers cache environment variables on start, we need to read the Apple client secret
   * from the host environment file and set it into the runtime environment before the app fully initializes.
   */
  init(ActionInitFilterEventHelper.INIT_APP_BEFORE, async () => {
    await readSecretFromHostEnvAndSetToRuntime(ActionInitFilterEventHelper.INIT_APP_BEFORE);
  });

  init(ActionInitFilterEventHelper.CLI_INIT_BEFORE, async () => {
    await readSecretFromHostEnvAndSetToRuntime(ActionInitFilterEventHelper.CLI_INIT_BEFORE);
  });

  init(ActionInitFilterEventHelper.INIT_APP_STARTED, async () => {
    await checkForRefresh('startup');
  });

  // Run once per day at 03:00 server time.
  schedule(CronHelper.getCronString(CronHelper.EVERY_DAY_AT_3AM), async () => {
    await checkForRefresh('check apple token refresh');
  });
});
