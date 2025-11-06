import * as jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import {
  APPLE_AUDIENCE,
  MAX_TOKEN_LIFETIME_SECONDS,
  generateAppleClientSecret,
  decodeAppleClientSecret,
} from '../apple/generateAppleClientSecret';

const TEST_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgPhGv5kH1huPMjeUh
XxNOqaNrvBNwaUzhTZSi9LUzBmyhRANCAAQLMKz+4388cQhZZIx6uUDWZtQNtGoo
b1DRtcQeGsy1RrSSz3I5MGLGcFZE7aOYL6hyfR+rLBMimROskVQjSziU
-----END PRIVATE KEY-----`;

const TEST_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAECzCs/uN/PHEIWWSMerlA1mbUDbRq
KG9Q0bXEHhrMtUa0ks9yOTBixnBWRO2jmC+ocn0fqywTIpkTrJFUI0s4lA==
-----END PUBLIC KEY-----`;

const TEST_TEAM_ID = 'TEAMID123';
const TEST_CLIENT_ID = 'com.example.app';
const TEST_KEY_ID = 'ABC123XYZ';

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
      teamId: TEST_TEAM_ID,
      clientId: TEST_CLIENT_ID,
      keyId: TEST_KEY_ID,
      privateKey: TEST_PRIVATE_KEY.replace(/\n/g, '\\n'),
      lifetimeSeconds: MAX_TOKEN_LIFETIME_SECONDS + 3600,
    });

    expect(result.expiresAt).toBe(fixedTimestampSeconds + MAX_TOKEN_LIFETIME_SECONDS);

    const decoded = decodeAppleClientSecret(result.token) as JwtPayload;
    expect(decoded).toMatchObject({
      iss: TEST_TEAM_ID,
      sub: TEST_CLIENT_ID,
      aud: APPLE_AUDIENCE,
    });
    expect(decoded.exp).toBe(result.expiresAt);
    expect(decoded.iat).toBe(result.expiresAt - MAX_TOKEN_LIFETIME_SECONDS);

    const verified = jwt.verify(result.token, TEST_PUBLIC_KEY, {
      algorithms: ['ES256'],
      audience: APPLE_AUDIENCE,
      issuer: TEST_TEAM_ID,
      subject: TEST_CLIENT_ID,
    }) as JwtPayload;
    expect(verified.exp).toBe(result.expiresAt);

    const { header } = jwt.decode(result.token, { complete: true }) as { header: jwt.JwtHeader };
    expect(header.kid).toBe(TEST_KEY_ID);
  });
});
