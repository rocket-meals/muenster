import { defineHook } from '@directus/extensions-sdk';
import Redis from 'ioredis';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { ActionInitFilterEventHelper } from '../../../helpers/ActionInitFilterEventHelper';
import {
  AppleClientSecretConfig,
  AppleClientSecretResult,
  MAX_TOKEN_LIFETIME_SECONDS,
  generateAppleClientSecret,
} from 'repo-depkit-common-backend';

const APPLE_SECRET_REDIS_KEY = 'directus:auth:apple:client-secret';
const APPLE_SECRET_LOCK_KEY = `${APPLE_SECRET_REDIS_KEY}:lock`;
const LOCK_TTL_MS = 30_000;
const REFRESH_THRESHOLD_SECONDS = 60 * 60 * 24 * 30; // Refresh if expiring within 30 days
const POST_LOCK_WAIT_MS = 1_000;

function buildConfigFromEnv(): AppleClientSecretConfig | null {
  const teamId = process.env.APPLE_TEAM_ID;
  const clientId = process.env.APPLE_CLIENT_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY;

  const missing = [
    !teamId && 'APPLE_TEAM_ID',
    !clientId && 'APPLE_CLIENT_ID',
    !keyId && 'APPLE_KEY_ID',
    !privateKey && 'APPLE_PRIVATE_KEY',
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    console.warn('[AppleSecretRotator] Missing environment variables:', missing.join(', '));
    return null;
  }

  return {
    teamId: teamId!,
    clientId: clientId!,
    keyId: keyId!,
    privateKey: privateKey!,
    lifetimeSeconds: MAX_TOKEN_LIFETIME_SECONDS,
  };
}

function decodeExpiry(token: string): number | null {
  const decoded = jwt.decode(token) as JwtPayload | null;
  return decoded?.exp ?? null;
}

async function releaseLock(redis: Redis, lockValue: string): Promise<void> {
  try {
    await redis.eval(
      `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`,
      1,
      APPLE_SECRET_LOCK_KEY,
      lockValue
    );
  } catch (error) {
    console.error('[AppleSecretRotator] Failed to release Redis lock:', error);
  }
}

async function acquireLock(redis: Redis): Promise<string | null> {
  const lockValue = `${process.pid}-${Date.now()}-${Math.random()}`;
  const acquired = await redis.set(APPLE_SECRET_LOCK_KEY, lockValue, 'PX', LOCK_TTL_MS, 'NX');
  return acquired === 'OK' ? lockValue : null;
}

async function refreshSecret(redis: Redis, config: AppleClientSecretConfig): Promise<AppleClientSecretResult | null> {
  const lockValue = await acquireLock(redis);
  if (!lockValue) {
    console.log('[AppleSecretRotator] Another instance is refreshing the Apple client secret.');
    // Wait shortly to allow the other instance to finish and fetch the updated value afterwards.
    await new Promise((resolve) => setTimeout(resolve, POST_LOCK_WAIT_MS));
    const token = await redis.get(APPLE_SECRET_REDIS_KEY);
    if (!token) {
      console.warn('[AppleSecretRotator] Expected Apple client secret to be set by another instance, but none was found.');
      return null;
    }

    const expiresAt = decodeExpiry(token);
    if (expiresAt) {
      console.log('[AppleSecretRotator] Loaded Apple client secret from Redis after waiting. Expires at', new Date(expiresAt * 1000).toISOString());
    }

    return {
      token,
      expiresAt: expiresAt ?? Math.floor(Date.now() / 1000) + MAX_TOKEN_LIFETIME_SECONDS,
    };
  }

  try {
    const result = generateAppleClientSecret(config);
    const ttlSeconds = Math.max(1, result.expiresAt - Math.floor(Date.now() / 1000));
    await redis.set(APPLE_SECRET_REDIS_KEY, result.token, 'EX', ttlSeconds);
    console.log('[AppleSecretRotator] Generated new Apple client secret. Expires at', new Date(result.expiresAt * 1000).toISOString());
    return result;
  } catch (error) {
    console.error('[AppleSecretRotator] Failed to generate Apple client secret:', error);
    return null;
  } finally {
    await releaseLock(redis, lockValue);
  }
}

async function ensureSecret(redis: Redis, config: AppleClientSecretConfig): Promise<AppleClientSecretResult | null> {
  const cachedToken = await redis.get(APPLE_SECRET_REDIS_KEY);
  const now = Math.floor(Date.now() / 1000);

  if (cachedToken) {
    const expiresAt = decodeExpiry(cachedToken);
    if (expiresAt) {
      const secondsRemaining = expiresAt - now;
      if (secondsRemaining > REFRESH_THRESHOLD_SECONDS) {
        console.log('[AppleSecretRotator] Loaded Apple client secret from Redis. Expires at', new Date(expiresAt * 1000).toISOString());
        return {
          token: cachedToken,
          expiresAt,
        };
      }
      console.log('[AppleSecretRotator] Apple client secret is nearing expiration. Triggering refresh.');
    } else {
      console.log('[AppleSecretRotator] Apple client secret found in Redis, but expiration could not be determined. Triggering refresh.');
    }
  } else {
    console.log('[AppleSecretRotator] No Apple client secret found in Redis. Generating a new one.');
  }

  return await refreshSecret(redis, config);
}

export default defineHook(async ({ init, schedule }) => {
  const config = buildConfigFromEnv();
  if (!config) {
    console.warn('[AppleSecretRotator] Hook disabled due to missing configuration.');
    return;
  }

  const redisUrl = process.env.REDIS;
  if (!redisUrl) {
    console.warn('[AppleSecretRotator] Hook disabled because REDIS environment variable is not set.');
    return;
  }

  const redis = new Redis(redisUrl);

  const runRefresh = async (reason: string) => {
    try {
      await ensureSecret(redis, config);
    } catch (error) {
      console.error(`[AppleSecretRotator] Failed to refresh Apple client secret during ${reason}:`, error);
    }
  };

  init(ActionInitFilterEventHelper.INIT_APP_STARTED, async () => {
    await runRefresh('startup');
  });

  // Run once per day at 02:00 server time.
  schedule('0 0 2 * * *', async () => {
    await runRefresh('scheduled refresh');
  });
});
