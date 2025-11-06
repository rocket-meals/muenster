import { defineHook } from '@directus/extensions-sdk';
import Redis from 'ioredis';
import * as jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import { ActionInitFilterEventHelper } from '../helpers/ActionInitFilterEventHelper';
import {
  AppleClientSecretConfig,
  AppleClientSecretResult,
  MAX_TOKEN_LIFETIME_SECONDS,
  generateAppleClientSecret,
} from './apple/generateAppleClientSecret';
import {CronHelper} from "../helpers/CronHelper";

const APPLE_SECRET_REDIS_KEY = 'directus:auth:apple:client-secret';
const APPLE_SECRET_LOCK_KEY = `${APPLE_SECRET_REDIS_KEY}:lock`;
const LOCK_TTL_MS = 30_000;
const REFRESH_THRESHOLD_SECONDS = 60 * 60 * 24 * 30; // Refresh if expiring within 30 days
const POST_LOCK_WAIT_MS = 1_000;

// In-memory fallback store used when REDIS is not configured.
let inMemoryToken: { token?: string; expiresAt?: number } = {};

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
  const decoded = jwt.decode(token) as JwtPayload | null;
  return decoded?.exp ?? null;
}

async function releaseLock(redis: Redis | null, lockValue: string): Promise<void> {
  if (!redis) return;

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

async function acquireLock(redis: Redis | null): Promise<string | null> {
  if (!redis) return null;
  const lockValue = `${process.pid}-${Date.now()}-${Math.random()}`;
  const acquired = await redis.set(APPLE_SECRET_LOCK_KEY, lockValue, 'PX', LOCK_TTL_MS, 'NX');
  return acquired === 'OK' ? lockValue : null;
}

async function refreshSecret(redis: Redis | null, config: AppleClientSecretConfig): Promise<AppleClientSecretResult | null> {
  // Standalone mode: no redis configured -> generate and keep token in memory per instance.
  if (!redis) {
    console.warn('[AppleSecretRotator] REDIS not configured — running in standalone mode. Each instance will manage its own Apple client secret.');
    try {
      const result = generateAppleClientSecret(config);
      inMemoryToken.token = result.token;
      inMemoryToken.expiresAt = result.expiresAt;
      // Set process.env so other parts of the app can read the current secret
      process.env.AUTH_APPLE_CLIENT_SECRET = result.token;
      console.log('[AppleSecretRotator] Generated new Apple client secret (standalone). Expires at', new Date(result.expiresAt * 1000).toISOString());
      return result;
    } catch (error) {
      console.error('[AppleSecretRotator] Failed to generate Apple client secret (standalone):', error);
      return null;
    }
  }

  console.log("--------------------------------------------------------------------------------------------");
  console.log("--------------------------------------------------------------------------------------------");
  console.log("---------------------------- Acquiring lock to refresh Apple client secret -----------------");

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

    // Ensure process.env is updated with the token
    process.env.AUTH_APPLE_CLIENT_SECRET = token;

    return {
      token,
      expiresAt: expiresAt ?? Math.floor(Date.now() / 1000) + MAX_TOKEN_LIFETIME_SECONDS,
    };
  }

  try {
    const result = generateAppleClientSecret(config);
    const ttlSeconds = Math.max(1, result.expiresAt - Math.floor(Date.now() / 1000));
    await redis.set(APPLE_SECRET_REDIS_KEY, result.token, 'EX', ttlSeconds);
    // Set process.env so other parts of the app can read the current secret
    process.env.AUTH_APPLE_CLIENT_SECRET = result.token;
    console.log('[AppleSecretRotator] Generated new Apple client secret. Expires at', new Date(result.expiresAt * 1000).toISOString());
    return result;
  } catch (error) {
    console.error('[AppleSecretRotator] Failed to generate Apple client secret:', error);
    return null;
  } finally {
    await releaseLock(redis, lockValue);
  }
}

async function ensureSecret(redis: Redis | null, config: AppleClientSecretConfig): Promise<AppleClientSecretResult | null> {
  const now = Math.floor(Date.now() / 1000);

  // Standalone mode: use in-memory token store
  if (!redis) {
    const cachedToken = inMemoryToken.token;

    if (cachedToken) {
      const expiresAt = decodeExpiry(cachedToken);
      if (expiresAt) {
        const secondsRemaining = expiresAt - now;
        if (secondsRemaining > REFRESH_THRESHOLD_SECONDS) {
          console.log('[AppleSecretRotator] Loaded Apple client secret from in-memory store. Expires at', new Date(expiresAt * 1000).toISOString());
          // populate process.env for consumers
          process.env.AUTH_APPLE_CLIENT_SECRET = cachedToken;
          return {
            token: cachedToken,
            expiresAt,
          };
        }
        console.log('[AppleSecretRotator] Apple client secret in-memory is nearing expiration. Triggering refresh.');
      } else {
        console.log('[AppleSecretRotator] Apple client secret found in in-memory store, but expiration could not be determined. Triggering refresh.');
      }
    } else {
      console.log('[AppleSecretRotator] No Apple client secret found in in-memory store. Generating a new one.');
    }

    return await refreshSecret(null, config);
  }

  const cachedToken = await redis.get(APPLE_SECRET_REDIS_KEY);

  if (cachedToken) {
    const expiresAt = decodeExpiry(cachedToken);
    if (expiresAt) {
      const secondsRemaining = expiresAt - now;
      if (secondsRemaining > REFRESH_THRESHOLD_SECONDS) {
        console.log('[AppleSecretRotator] Loaded Apple client secret from Redis. Expires at', new Date(expiresAt * 1000).toISOString());
        // populate process.env for consumers
        process.env.AUTH_APPLE_CLIENT_SECRET = cachedToken;
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
    console.warn('[AppleSecretRotator] REDIS environment variable is not set — running in standalone mode. No cross-instance synchronization will be performed.');
  }

  const redis = redisUrl ? new Redis(redisUrl) : null;

  const runRefresh = async (reason: string) => {
    console.log(`[AppleSecretRotator] Running Apple client secret refresh check (${reason})...`);
    try {
      await ensureSecret(redis, config);
    } catch (error) {
      console.error(`[AppleSecretRotator] Failed to refresh Apple client secret during ${reason}:`, error);
    }
  };

  init(ActionInitFilterEventHelper.INIT_APP_STARTED, async () => {
    await runRefresh('startup');
    if(redis) {
      await refreshSecret(redis, config);
    } else {
      await refreshSecret(null, config);
    }
  });

  // Run once per day at 02:00 server time.
  schedule(CronHelper.getCronString(CronHelper.EVERY_MONTH_AT_1AM), async () => {
    await runRefresh('scheduled refresh');
  });
});
