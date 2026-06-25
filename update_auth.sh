#!/bin/bash
# Extract Google creds from JSON and update .env
JSON="/Users/user/.hermes/cache/documents/doc_ee0a1d6baba7_KAWANUANG_APP_client_secret_64142371258_64br77jkmn1a17p5qqjddf8uopq0h078.json"
ENV="/Users/user/kawan-finance/.env"

CLIENT_ID=$(python3 -c "import json; print(json.load(open('$JSON'))['web']['client_id'])")
CLIENT_SECRET=*** -c "import json; print(json.load(open('$JSON'))['web']['client_secret'])")

sed -i '' "s|^AUTH_GOOGLE_ID=.*|AUTH_GOOGLE_ID=$CLIENT_ID|" "$ENV"
sed -i '' "s|^AUTH_GOOGLE_SECRET=.*|AUTH_GOOGLE_SECRET=$CLIENT_SECRET...V"

echo "Done. Client ID prefix: ${CLIENT_ID:0:12}"
