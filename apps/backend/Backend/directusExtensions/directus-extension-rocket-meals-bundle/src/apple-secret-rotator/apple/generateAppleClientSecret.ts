import jwt from "jsonwebtoken";

export const APPLE_AUDIENCE = 'https://appleid.apple.com';
const days = 90;
export const MAX_TOKEN_LIFETIME_SECONDS = 60 * 60 * 24 * days; // 90 days

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

// Minimaler Payload-Typ, wir brauchen hauptsächlich .exp
export type AppleJwtPayload = {
  iss?: string;
  sub?: string;
  aud?: string;
  iat?: number;
  exp?: number;
  [k: string]: any;
};

function normalisePrivateKey(privateKey: string): string {
  const trimmed = privateKey.trim();
  const normalisedLineEndings = trimmed.replace(/\r\n/g, '\n');

  if (normalisedLineEndings.includes('\\n')) {
    return normalisedLineEndings.replace(/\\n/g, '\n');
  }

  return normalisedLineEndings;
}

function base64UrlDecodeToString(input: string): string {
  // Replace url-safe characters
  let str = input.replace(/-/g, '+').replace(/_/g, '/');
  // Pad with '=' to make length a multiple of 4
  const pad = str.length % 4;
  if (pad === 2) str += '==';
  else if (pad === 3) str += '=';
  else if (pad === 1) str += '==='; // unlikely
  return Buffer.from(str, 'base64').toString('utf8');
}

// Decode the payload part of a JWT without verifying signature
export function decodeAppleClientSecret(token: string): AppleJwtPayload | null {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length < 2) return null;

  const payloadPart = parts[1];
  if (!payloadPart) return null;

  try {
    const json = base64UrlDecodeToString(payloadPart);
    return JSON.parse(json) as AppleJwtPayload;
  } catch (e) {
    return null;
  }
}

export function generateAppleClientSecret(config: AppleClientSecretConfig): AppleClientSecretResult {
  const { teamId, clientId, keyId } = config;
  if (!teamId || !clientId || !keyId || !config.privateKey) {
    throw new Error('Missing configuration for Apple client secret generation.');
  }

  // Normalise private key formatting (handle escaped newlines)
  const privateKey = normalisePrivateKey(config.privateKey);

  const lifetime = Math.min(config.lifetimeSeconds ?? 60 * 60, MAX_TOKEN_LIFETIME_SECONDS);

  const payload: AppleJwtPayload = {
    iss: config.teamId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + lifetime, // expiration in seconds
    aud: APPLE_AUDIENCE,
    sub: config.clientId,
  };

  const options = {
    algorithm: 'ES256' as const,
    header: {
      kid: config.keyId,
      typ: 'JWT',
    },
  };

  // Pass the private key as a Buffer to satisfy the typings for jwt.sign
  const clientSecret = jwt.sign(payload as object, Buffer.from(privateKey), options as any);

  const expiresAt = payload.exp ?? (Math.floor(Date.now() / 1000) + lifetime);

  return {
    token: clientSecret,
    expiresAt,
  };
}
