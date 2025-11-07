#!/bin/sh

# Display help message
show_help() {
    echo "Usage: ./genSSO_Apple.sh --team_id <team_id> --client_id <client_id> --key_id <key_id> --key_file_path <path_to_key_file>"
    echo "or:    ./genSSO_Apple.sh --team_id <team_id> --client_id <client_id> --key_id <key_id> --key_file_content '<key_file_content>'"
}

# Initialize parameters
TEAM_ID=""
CLIENT_ID=""
KEY_ID=""
KEY_FILE_PATH=""
KEY_FILE_CONTENT=""

# Parse command-line arguments
while [ "$#" -gt 0 ]; do
    case "$1" in
        --team_id)
            TEAM_ID="$2"
            shift 2
            ;;
        --client_id)
            CLIENT_ID="$2"
            shift 2
            ;;
        --key_id)
            KEY_ID="$2"
            shift 2
            ;;
        --key_file_path)
            KEY_FILE_PATH="$2"
            shift 2
            ;;
        --key_file_content)
            KEY_FILE_CONTENT="$2"
            shift 2
            ;;
        *)
            echo "Invalid option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate required parameters
MISSING=""
[ -z "$TEAM_ID" ] && MISSING="$MISSING team_id"
[ -z "$CLIENT_ID" ] && MISSING="$MISSING client_id"
[ -z "$KEY_ID" ] && MISSING="$MISSING key_id"
[ -z "$KEY_FILE_PATH" ] && [ -z "$KEY_FILE_CONTENT" ] && MISSING="$MISSING key_file_path/key_file_content"

if [ -n "$MISSING" ]; then
    echo "Missing required parameters:$MISSING"
    show_help
    exit 1
fi

# Read the EC key
if [ -n "$KEY_FILE_PATH" ]; then
    if [ ! -f "$KEY_FILE_PATH" ]; then
        echo "Error: Key file '$KEY_FILE_PATH' not found."
        exit 1
    fi
    ECDSA_KEY=$(cat "$KEY_FILE_PATH")
else
    ECDSA_KEY="$KEY_FILE_CONTENT"
fi

# Generate times
CURRENT_TIME=$(date +%s)
EXPIRATION_TIME=$(expr "$CURRENT_TIME" + 86400 \* 180)

# Create JWT header and claims
HEADER=$(printf '{"kid":"%s","alg":"ES256"}' "$KEY_ID")
CLAIMS=$(printf '{"iss":"%s","iat":%d,"exp":%d,"aud":"https://appleid.apple.com","sub":"%s"}' \
    "$TEAM_ID" "$CURRENT_TIME" "$EXPIRATION_TIME" "$CLIENT_ID")

# Base64 URL encode helper
base64_url_encode() {
    openssl enc -base64 -A | tr '+/' '-_' | tr -d '='
}

JWT_HEADER_BASE64=$(echo -n "$HEADER" | base64_url_encode)
JWT_CLAIMS_BASE64=$(echo -n "$CLAIMS" | base64_url_encode)

# Convert DER to raw signature (R+S)
convert_ec() {
    INPUT=$(openssl asn1parse -inform der)
    R=$(echo "$INPUT" | head -n 2 | tail -n 1 | cut -d':' -f4)
    S=$(echo "$INPUT" | head -n 3 | tail -n 1 | cut -d':' -f4)
    echo -n "$R" | xxd -r -p
    echo -n "$S" | xxd -r -p
}

# Sign the JWT
# Save key temporarily since /bin/sh has no process substitution
TMPKEY=$(mktemp)
echo "$ECDSA_KEY" > "$TMPKEY"

SIGNATURE=$(echo -n "$JWT_HEADER_BASE64.$JWT_CLAIMS_BASE64" \
    | openssl dgst -binary -sha256 -sign "$TMPKEY" \
    | convert_ec \
    | openssl base64 -e -A | tr '+/' '-_' | tr -d '\n=')

rm -f "$TMPKEY"

# Output final JWT
echo "${JWT_HEADER_BASE64}.${JWT_CLAIMS_BASE64}.${SIGNATURE}"

