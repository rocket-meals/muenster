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

  it('test decodeAppleClientSecret', () => {

    // Manually
    const testTokenToDecode = "eyJraWQiOiJBQkMxMjNYWVoiLCJhbGciOiJFUzI1NiJ9.eyJpc3MiOiJURUFNSUQxMjMiLCJpYXQiOjE3NjI0NzAwNTQsImV4cCI6MTc3ODAyMjA1NCwiYXVkIjoiaHR0cHM6Ly9hcHBsZWlkLmFwcGxlLmNvbSIsInN1YiI6ImNvbS5leGFtcGxlLmFwcCJ9.63lA4G3NpxaHM7QiKZPilnzTPOBQo1tYqEOiS-i6R2zrZV1vcK2anvtfoB8RKp_fTP9fPA59ovZ0NgCXDlMnxg"
      let decoded = decodeAppleClientSecret(testTokenToDecode);
      expect(decoded).not.toBeNull();
      expect(decoded?.iss).toBe("TEAMID123");
      expect(decoded?.aud).toBe(APPLE_AUDIENCE);
      expect(decoded?.sub).toBe("com.example.app");
      expect(decoded?.iat).toBe(1762470054);
      expect(decoded?.exp).toBe(1778022054);
  });

  it('generates a valid Apple client secret', () => {
    const result = generateAppleClientSecret({
      teamId: TEST_TEAM_ID,
      clientId: TEST_CLIENT_ID,
      keyId: TEST_KEY_ID,
      privateKey: TEST_PRIVATE_KEY,
      lifetimeSeconds: MAX_TOKEN_LIFETIME_SECONDS,
    });

    console.info(JSON.stringify(result, null, 2));
    expect(result).toHaveProperty('token');
  });

});
