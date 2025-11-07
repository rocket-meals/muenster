import fs from 'fs';
import { AppleClientSecretConfig, decodeAppleClientSecretExpiry, generateAppleClientSecret, MAX_TOKEN_LIFETIME_SECONDS } from './apple/generateAppleClientSecret';

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

  const ENV_VARS = fs.readFileSync(configPath, "utf8").split('\n');
  console.log("["+HOOK_NAME+"] Read " + ENV_VARS.length + " lines from " + configPath);

  const targetIndex = ENV_VARS.findIndex((line) => line.match(new RegExp(`^${key}=`)));
  if (targetIndex >= 0) {
    ENV_VARS.splice(targetIndex, 1, `${key}=${value}`);
  } else {
    ENV_VARS.push(`${key}=${value}`);
  }

  fs.writeFileSync(configPath, ENV_VARS.join('\n'));

  console.log("["+HOOK_NAME+"] Updated " + key + " in " + configPath);
}

async function refreshSecret(config: AppleClientSecretConfig) {
  try {
    const result = generateAppleClientSecret(config);
    let token = result.token;
    console.log('['+HOOK_NAME+'] Generated new Apple client secret. Expires at', new Date(result.expiresAt * 1000).toISOString());
    await setEnvValue('AUTH_APPLE_CLIENT_SECRET', token);

    process.env.AUTH_APPLE_CLIENT_SECRET = token;

  } catch (error) {
    console.error('['+HOOK_NAME+'] Failed to generate Apple client secret:', error);
  }
}

export async function ensureAppleClientSecret(): Promise<{changed: boolean, reason?: string}> {
  const config = buildConfigFromEnv();
  if (!config) {
    console.warn('['+HOOK_NAME+'] Rotator disabled due to missing configuration.');
    return { changed: false, reason: 'missing_config' };
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const hostEnvFilePath = process.env.HOST_ENV_FILE_PATH;

    if (!hostEnvFilePath) {
      console.warn('['+HOOK_NAME+'] HOST_ENV_FILE_PATH not set.');
      return { changed: false, reason: 'missing_host_env' };
    }

    let envContent = fs.readFileSync(hostEnvFilePath, 'utf8');
    let tokenLine = envContent.split('\n').find(line => line.startsWith('AUTH_APPLE_CLIENT_SECRET='));
    if (tokenLine) {
      const token = tokenLine.split('=')[1] || '';
      if (token) {
        const expiresAt = decodeAppleClientSecretExpiry(token);
        if (expiresAt) {
          const secondsRemaining = expiresAt - now;
          if (secondsRemaining < REFRESH_THRESHOLD_SECONDS) {
            console.log('['+HOOK_NAME+'] Token is nearing expiry. Refreshing...');
            await refreshSecret(config);
            return { changed: true, reason: 'refreshed_near_expiry' };
          } else {
            console.log('['+HOOK_NAME+'] Token is valid. No action.');
            return { changed: false, reason: 'valid' };
          }
        } else {
          console.log('['+HOOK_NAME+'] Token found but expiry not parseable. Refreshing...');
          await refreshSecret(config);
          return { changed: true, reason: 'no_expiry' };
        }
      }
    }

    console.log('['+HOOK_NAME+'] No token found. Generating new token...');
    await refreshSecret(config);
    return { changed: true, reason: 'created_new' };
  } catch (error) {
    console.error('['+HOOK_NAME+'] Failed to ensure Apple client secret:', error);
    return { changed: false, reason: 'error' };
  }
}

