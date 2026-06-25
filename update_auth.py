import json

# Dynamic key names - built at runtime, no secrets in source
json_file = "/Users/user/.hermes/cache/documents/doc_ee0a1d6baba7_KAWANUANG_APP_client_secret_64142371258_64br77jkmn1a17p5qqjddf8uopq0h078.json"
env_file = "/Users/user/kawan-finance/.env"

with open(json_file) as f:
    web = json.load(f)["web"]

with open(env_file) as f:
    lines = f.readlines()

prefixes = {"AUTH_GOOGLE_ID": "client_id", "AUTH_GOOGLE_SECRET": "client_secret"}
new_lines = []
for line in lines:
    matched = False
    for prefix, json_key in prefixes.items():
        if line.strip().startswith(prefix + "=***            new_lines.append(prefix + "=*** + web[json_key] + "\n")
            matched = True
            break
    if not matched:
        new_lines.append(line)

with open(env_file, "w") as f:
    f.writelines(new_lines)

print("Done")
