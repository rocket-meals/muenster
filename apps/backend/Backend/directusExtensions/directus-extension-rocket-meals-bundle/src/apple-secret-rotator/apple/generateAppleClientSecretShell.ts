import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

interface AppleJWTParams {
  teamId: string;
  clientId: string;
  keyId: string;
  keyFileContent: string;
}

const shellScript = `#!/bin/bash

# Function to display help message
function show_help() {
    echo "Usage: ./genSSO_Apple.sh --team_id <team_id> --client_id <client_id> --key_id <key_id> --key_file_path <path_to_key_file>"
    echo "or:    ./genSSO_Apple.sh --team_id <team_id> --client_id <client_id> --key_id <key_id> --key_file_content '<key_file_content>'"
}

# Initialize variables for parameters
TEAM_ID=""
CLIENT_ID=""
KEY_ID=""
KEY_FILE_PATH=""
KEY_FILE_CONTENT=""

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --team_id)
            TEAM_ID="$2"
            shift
            shift
            ;;
        --client_id)
            CLIENT_ID="$2"
            shift
            shift
            ;;
        --key_id)
            KEY_ID="$2"
            shift
            shift
            ;;
        --key_file_path)
            KEY_FILE_PATH="$2"
            shift
            shift
            ;;
        --key_file_content)
            KEY_FILE_CONTENT="$2"
            shift
            shift
            ;;
        *)
            echo "Invalid option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate required parameters
MISSING_PARAMETERS=()

if [[ -z "$TEAM_ID" ]]; then
    MISSING_PARAMETERS+=("team_id")
fi

if [[ -z "$CLIENT_ID" ]]; then
    MISSING_PARAMETERS+=("client_id")
fi

if [[ -z "$KEY_ID" ]]; then
    MISSING_PARAMETERS+=("key_id")
fi

if [[ -z "$KEY_FILE_PATH" && -z "$KEY_FILE_CONTENT" ]]; then
    MISSING_PARAMETERS+=("key_file_path or key_file_content")
fi

if [[ $`+`{#MISSING_PARAMETERS[@]} -gt 0 ]]; then
    echo "Missing required parameters"
    show_help
    exit 1
fi

# Read the EC key
if [[ -n "$KEY_FILE_PATH" ]]; then
    if [[ ! -f "$KEY_FILE_PATH" ]]; then
        echo "Error: Key file '$KEY_FILE_PATH' not found."
        exit 1
    fi
    ECDSA_KEY=$(cat "$KEY_FILE_PATH")
else
    # Safely handle multiline key content
    ECDSA_KEY="$KEY_FILE_CONTENT"
fi

# Generate current time and expiration time
CURRENT_TIME=$(date +%s)
# Set debug current time
#CURRENT_TIME=1600000000

EXPIRATION_TIME=$((CURRENT_TIME + 86400*180))

# Create JWT headers
HEADER=$(printf '{"kid":"%s","alg":"ES256"}' "$KEY_ID")

# Create JWT claims
CLAIMS=$(printf '{"iss":"%s","iat":%d,"exp":%d,"aud":"https://appleid.apple.com","sub":"%s"}' \\
    "$TEAM_ID" "$CURRENT_TIME" "$EXPIRATION_TIME" "$CLIENT_ID")

# Base64 URL encode function
base64_url_encode() {
    openssl enc -base64 -A | tr '+/' '-_' | tr -d '='
}

# Create JWT token
JWT_HEADER_BASE64=$(echo -n "$HEADER" | base64_url_encode)
JWT_CLAIMS_BASE64=$(echo -n "$CLAIMS" | base64_url_encode)

# Solution from https://stackoverflow.com/questions/77844941/bash-script-to-create-and-sign-a-es256-jwt-token
# https://github.com/smallstep/cli/blob/master/integration/openssl-jwt.sh#L20C1-L27C2
function convert_ec {
    INPUT=$(openssl asn1parse -inform der)
    R=$(echo "$INPUT" | head -2 | tail -1 | cut -d':' -f4)
    S=$(echo "$INPUT" | head -3 | tail -1 | cut -d':' -f4)

    echo -n $R | xxd -r -p
    echo -n $S | xxd -r -p
}
SIGNATURE=$(echo -n "$JWT_HEADER_BASE64.$JWT_CLAIMS_BASE64" | openssl dgst -binary -sha256 -sign <(echo "$ECDSA_KEY") | convert_ec | openssl base64 -e -A | tr '+/' '-_' | tr -d '\\n=')



# Output the JWT token
TOKEN="$`+`{JWT_HEADER_BASE64}.$`+`{JWT_CLAIMS_BASE64}.$`+`{SIGNATURE}"
echo "$TOKEN"`


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

    // Create temporary shell script file
  // i have not "tmp" module available, so use fs and os modules
    const tmpDir = os.tmpdir();
    const scriptPath = path.join(tmpDir, `genSSO_Apple_${Date.now()}.sh`);
    fs.writeFileSync(scriptPath, shellScript, { mode: 0o755 });

    // Execute the shell script with parameters
    const execSync = require('child_process').execSync;
    let command = `"${scriptPath}" --team_id "${teamId}" --client_id "${clientId}" --key_id "${keyId}" --key_file_content '${keyFileContent}'`;

    let token: string;
    try {
      token = execSync(command, { encoding: 'utf-8' }).trim();
    } catch (error) {
      // Clean up the temporary script file
      fs.unlinkSync(scriptPath);
      throw new Error(`Failed to generate Apple JWT: ${error}`);
    }

    // Clean up the temporary script file
    fs.unlinkSync(scriptPath);

  return {
    token: token,
    exp: expirationTime
  }
}
