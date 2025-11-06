import * as jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';

export const APPLE_AUDIENCE = 'https://appleid.apple.com';
export const MAX_TOKEN_LIFETIME_SECONDS = 60 * 60 * 24 * 90; // 90 days

export type AppleClientSecretConfig = {
  teamId: string;
  clientId: string;
  keyId: string;
  privateKey: string;
  lifetimeSeconds?: number;
};

export type AppleClientSecretResult = {
  token: string;
  expiresAt: number;
};

function normalisePrivateKey(privateKey: string): string {
  const trimmed = privateKey.trim();
  const normalisedLineEndings = trimmed.replace(/\r\n/g, '\n');

  if (normalisedLineEndings.includes('\\n')) {
    return normalisedLineEndings.replace(/\\n/g, '\n');
  }

  return normalisedLineEndings;
}

export function generateAppleClientSecret(config: AppleClientSecretConfig): AppleClientSecretResult {
  const { teamId, clientId, keyId } = config;
  if (!teamId || !clientId || !keyId || !config.privateKey) {
    throw new Error('Missing configuration for Apple client secret generation.');
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  const requestedLifetime = config.lifetimeSeconds ?? MAX_TOKEN_LIFETIME_SECONDS;
  const lifetimeSeconds = Math.min(requestedLifetime, MAX_TOKEN_LIFETIME_SECONDS);
  const privateKey = normalisePrivateKey(config.privateKey);

  const token = jwt.sign(
    {},
    privateKey,
    {
      algorithm: 'ES256',
      keyid: keyId,
      issuer: teamId,
      subject: clientId,
      audience: APPLE_AUDIENCE,
      expiresIn: lifetimeSeconds,
    }
  );

  const decoded = jwt.decode(token) as JwtPayload | null;
  const expiresAt = decoded?.exp ?? nowInSeconds + lifetimeSeconds;

  return {
    token,
    expiresAt,
  };
}

export function decodeAppleClientSecret(token: string): JwtPayload | null {
  return jwt.decode(token) as JwtPayload | null;
}
