import jwt, { JwtPayload } from 'jsonwebtoken';
import {
  APPLE_AUDIENCE,
  MAX_TOKEN_LIFETIME_SECONDS,
  generateAppleClientSecret,
  decodeAppleClientSecret,
} from '../apple/generateAppleClientSecret';

const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgPhGv5kH1huPMjeUh
XxNOqaNrvBNwaUzhTZSi9LUzBmyhRANCAAQLMKz+4388cQhZZIx6uUDWZtQNtGoo
b1DRtcQeGsy1RrSSz3I5MGLGcFZE7aOYL6hyfR+rLBMimROskVQjSziU
-----END PRIVATE KEY-----`;

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAECzCs/uN/PHEIWWSMerlA1mbUDbRq
KG9Q0bXEHhrMtUa0ks9yOTBixnBWRO2jmC+ocn0fqywTIpkTrJFUI0s4lA==
-----END PUBLIC KEY-----`;

describe('generateAppleClientSecret', () => {
  const fixedDate = new Date('2024-01-01T00:00:00.000Z');
  const fixedTimestampSeconds = Math.floor(fixedDate.getTime() / 1000);

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(fixedDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('generates a signed token with capped lifetime and expected claims', () => {
    const result = generateAppleClientSecret({
      teamId: 'TEAMID123',
      clientId: 'com.example.app',
      keyId: 'ABC123XYZ',
      privateKey: PRIVATE_KEY.replace(/\n/g, '\\n'),
      lifetimeSeconds: MAX_TOKEN_LIFETIME_SECONDS + 3600,
    });

    expect(result.expiresAt).toBe(fixedTimestampSeconds + MAX_TOKEN_LIFETIME_SECONDS);

    const decoded = decodeAppleClientSecret(result.token) as JwtPayload;
    expect(decoded).toMatchObject({
      iss: 'TEAMID123',
      sub: 'com.example.app',
      aud: APPLE_AUDIENCE,
    });
    expect(decoded.exp).toBe(result.expiresAt);
    expect(decoded.iat).toBe(result.expiresAt - MAX_TOKEN_LIFETIME_SECONDS);

    const verified = jwt.verify(result.token, PUBLIC_KEY, {
      algorithms: ['ES256'],
      audience: APPLE_AUDIENCE,
      issuer: 'TEAMID123',
      subject: 'com.example.app',
    }) as JwtPayload;
    expect(verified.exp).toBe(result.expiresAt);

    const { header } = jwt.decode(result.token, { complete: true }) as { header: jwt.JwtHeader };
    expect(header.kid).toBe('ABC123XYZ');
  });
});
