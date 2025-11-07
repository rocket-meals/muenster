import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
// import child_process for execSync
import { execSync } from 'child_process';

interface AppleJWTParams {
  teamId: string;
  clientId: string;
  keyId: string;
  keyFileContent: string;
}

/**
 * Generate Apple SSO JWT token
 */
export function generateAppleJWTShell(params: AppleJWTParams) {
  const { teamId, clientId, keyId, keyFileContent } = params;

  // Validate required parameters
  const missingParams: string[] = [];

  if (!teamId) missingParams.push('teamId');
  if (!clientId) missingParams.push('clientId');
  if (!keyId) missingParams.push('keyId');
  if (!keyFileContent) {
    missingParams.push('keyFileContent or keyFilePath');
  }

  if (missingParams.length > 0) {
    throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
  }

  // Generate timestamps
  const currentTime = Math.floor(Date.now() / 1000);
  const expirationTime = currentTime + (86400 * 180); // 180 days



  try {
    let commandResult = execSync("pwd", { encoding: 'utf-8' }).trim();
    console.log(commandResult);
  } catch (error) {
    throw new Error(`Failed: ${error}`);
  }

  try {
    let commandResult = execSync("ls /directus", { encoding: 'utf-8' }).trim();
    console.log(commandResult);
  } catch (error) {
    throw new Error(`Failed: ${error}`);
  }

    // Execute the shell script with parameters
    let command = `/directus/sso/genSSO_Apple.sh --team_id "${teamId}" --client_id "${clientId}" --key_id "${keyId}" --key_file_content '${keyFileContent}'`;

    let token: string;
    try {
      token = execSync(command, { encoding: 'utf-8' }).trim();
    } catch (error) {
      throw new Error(`Failed to generate Apple JWT: ${error}`);
    }

  return {
    token: token,
    exp: expirationTime
  }
}

