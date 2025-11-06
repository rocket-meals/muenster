import crypto from 'crypto';
import {
  APPLE_AUDIENCE,
  decodeAppleClientSecret,
  generateAppleClientSecret,
  MAX_TOKEN_LIFETIME_SECONDS,
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

// Only the header and payload parts, signature will differ
const expectedTokenPartials = "eyJraWQiOiJBQkMxMjNYWVoiLCJhbGciOiJFUzI1NiJ9.eyJpc3MiOiJURUFNSUQxMjMiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYxNTU1MjAwMCwiYXVkIjoiaHR0cHM6Ly9hcHBsZWlkLmFwcGxlLmNvbSIsInN1YiI6ImNvbS5leGFtcGxlLmFwcCJ9.Z2fNWUqVkTCiptwAMvYi9qLrZyD7bqF8RKeuzhHK1NE0CTy9kh-cgglRiZWLKxVLjvVCp-k_q19yMBBWmJW_zA"

const TEST_TEAM_ID = 'TEAMID123';
const TEST_CLIENT_ID = 'com.example.app';
const TEST_KEY_ID = 'ABC123XYZ';

//describe('generateAppleClientSecret', () => {
describe('dev', () => {
  // 2020-09-13T12:26:40.000Z
  const fixedDate = new Date('2020-09-13T12:26:40.000Z'); // old date 2024-01-01T00:00:00.000Z
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
      privateKey: TEST_PRIVATE_KEY,
      lifetimeSeconds: MAX_TOKEN_LIFETIME_SECONDS + 1000, // request above cap
    });

    // token basic structure
    expect(result).toBeDefined();
    expect(typeof result.token).toBe('string');

    const parts = result.token.split('.');
    expect(parts.length).toBe(3);

    const [headerB64, payloadB64, signatureB64] = parts;

    // header and payload should match the expected values (signature may differ)
    const expectedParts = expectedTokenPartials.split('.');
    expect(headerB64).toBe(expectedParts[0]);
    expect(payloadB64).toBe(expectedParts[1]);

    // decode payload and verify claims
    const payload = decodeAppleClientSecret(result.token);
    expect(payload).not.toBeNull();
    if (!payload) return; // for TypeScript

    expect(payload.iss).toBe(TEST_TEAM_ID);
    expect(payload.sub).toBe(TEST_CLIENT_ID);
    expect(payload.aud).toBe(APPLE_AUDIENCE);
    expect(payload.iat).toBe(fixedTimestampSeconds);
    expect(payload.exp).toBe(fixedTimestampSeconds + MAX_TOKEN_LIFETIME_SECONDS);

    // verify result.expiresAt
    expect(result.expiresAt).toBe(payload.exp);

    // cryptographically verify signature using public key; signature is IEEE-P1363 (raw R||S)
    function base64UrlToBuffer(b64url: string): Buffer {
      let s = b64url.replace(/-/g, '+').replace(/_/g, '/');
      const pad = s.length % 4;
      if (pad === 2) s += '==';
      else if (pad === 3) s += '=';
      else if (pad === 1) s += '===';
      return Buffer.from(s, 'base64');
    }

    const signingInput = `${headerB64}.${payloadB64}`;
    const signatureBuffer = base64UrlToBuffer(signatureB64);

    const verified = crypto.verify('sha256', Buffer.from(signingInput, 'utf8'), {
      key: TEST_PUBLIC_KEY,
      dsaEncoding: 'ieee-p1363',
    }, signatureBuffer);

    expect(verified).toBe(true);

  });
});
