import * as crypto from 'crypto';
import * as fs from 'fs';

interface AppleJWTParams {
  teamId: string;
  clientId: string;
  keyId: string;
  keyFileContent?: string;
  keyFilePath?: string;
}

/**
 * Base64 URL encode function
 */
function base64UrlEncode(input: string | Buffer): string {
  const base64 = Buffer.from(input).toString('base64');
  return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
}

/**
 * Convert EC signature from ASN.1 DER format to raw format (r|s)
 * This matches the bash script's convert_ec function
 */
function convertECSignature(derSignature: Buffer): Buffer {
  // Parse ASN.1 DER structure
  let offset = 0;

  // Check SEQUENCE tag (0x30)
  if (derSignature[offset] !== 0x30) {
    throw new Error('Invalid DER signature: missing SEQUENCE tag');
  }
  offset += 1;

  // Skip sequence length
  const sequenceLength = derSignature[offset];
  offset += 1;

  // Parse R value
  if (derSignature[offset] !== 0x02) {
    throw new Error('Invalid DER signature: missing R INTEGER tag');
  }
  offset += 1;

  let rLength = derSignature[offset];
  offset += 1;

  let rOffset = offset;
  let r = derSignature.slice(rOffset, rOffset + rLength);
  offset += rLength;

  // Parse S value
  if (derSignature[offset] !== 0x02) {
    throw new Error('Invalid DER signature: missing S INTEGER tag');
  }
  offset += 1;

  let sLength = derSignature[offset];
  offset += 1;

  let sOffset = offset;
  let s = derSignature.slice(sOffset, sOffset + sLength);

  // Remove leading zero padding if present (for positive integers in ASN.1)
  while (r.length > 32 && r[0] === 0x00) {
    r = r.slice(1);
  }
  while (s.length > 32 && s[0] === 0x00) {
    s = s.slice(1);
  }

  // Pad to exactly 32 bytes if shorter
  while (r.length < 32) {
    r = Buffer.concat([Buffer.from([0x00]), r]);
  }
  while (s.length < 32) {
    s = Buffer.concat([Buffer.from([0x00]), s]);
  }

  // Ensure exactly 32 bytes each
  if (r.length > 32) {
    r = r.slice(r.length - 32);
  }
  if (s.length > 32) {
    s = s.slice(s.length - 32);
  }

  // Concatenate R and S (64 bytes total for ES256)
  return Buffer.concat([r, s]);
}

/**
 * Generate Apple SSO JWT token
 */
export function generateAppleJWTClaude(params: AppleJWTParams) {
  const { teamId, clientId, keyId, keyFileContent, keyFilePath } = params;

  // Validate required parameters
  const missingParams: string[] = [];

  if (!teamId) missingParams.push('teamId');
  if (!clientId) missingParams.push('clientId');
  if (!keyId) missingParams.push('keyId');
  if (!keyFileContent && !keyFilePath) {
    missingParams.push('keyFileContent or keyFilePath');
  }

  if (missingParams.length > 0) {
    throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
  }

  // Read the EC key
  let ecdsaKey: string;
  if (keyFilePath) {
    if (!fs.existsSync(keyFilePath)) {
      throw new Error(`Key file '${keyFilePath}' not found.`);
    }
    ecdsaKey = fs.readFileSync(keyFilePath, 'utf8');
  } else {
    ecdsaKey = keyFileContent!;
  }

  // Ensure key has proper line breaks (handle escaped \n)
  if (ecdsaKey.includes('\\n')) {
    ecdsaKey = ecdsaKey.replace(/\\n/g, '\n');
  }

  // Generate timestamps
  const currentTime = Math.floor(Date.now() / 1000);
  const expirationTime = currentTime + (86400 * 180); // 180 days

  // Create JWT header
  const header = {
    kid: keyId,
    alg: 'ES256'
  };

  // Create JWT claims
  const claims = {
    iss: teamId,
    iat: currentTime,
    exp: expirationTime,
    aud: 'https://appleid.apple.com',
    sub: clientId
  };

  // Encode header and claims
  const jwtHeaderBase64 = base64UrlEncode(JSON.stringify(header));
  const jwtClaimsBase64 = base64UrlEncode(JSON.stringify(claims));

  // Create signature input
  const signatureInput = `${jwtHeaderBase64}.${jwtClaimsBase64}`;

  // Sign with ES256 (ECDSA with SHA-256)
  const sign = crypto.createSign('SHA256');
  sign.update(signatureInput);
  sign.end();

  // Get DER signature
  const derSignature = sign.sign(ecdsaKey);

  // Convert DER signature to raw format (r|s concatenated)
  const rawSignature = convertECSignature(derSignature);

  // Base64 URL encode the signature
  const signatureBase64 = base64UrlEncode(rawSignature);

  // Combine all parts
  const token = `${jwtHeaderBase64}.${jwtClaimsBase64}.${signatureBase64}`;

  return {
    token: token,
    exp: expirationTime
  }
}
