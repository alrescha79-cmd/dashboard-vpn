import { executeSSHCommand, type SSHServerConfig } from "../../lib/ssh";
import type { CreateProtocolParams, ProtocolResult } from "./types";

export function buildVLessCreateScript(p: { username: string; uuid: string; expFormatted: string; quotaGb: number; iplimit: number }): string {
  return `
user="${p.username}"
uuid="${p.uuid}"
exp_date="${p.expFormatted}"
quota=${p.quotaGb}
ip_limit=${p.iplimit}
domain=$(cat /etc/xray/domain 2>/dev/null || hostname -f)
city=$(cat /etc/xray/city 2>/dev/null || echo "Unknown")

if [ ! -f "/etc/xray/vless/config.json" ]; then
  if [ -f "/etc/xray/config.json" ]; then
    CONFIG_FILE="/etc/xray/config.json"
  else
    mkdir -p /etc/xray/vless
    echo '{"inbounds":[]}' > /etc/xray/vless/config.json
    CONFIG_FILE="/etc/xray/vless/config.json"
  fi
else
  CONFIG_FILE="/etc/xray/vless/config.json"
fi

if grep -q "^### $user " "$CONFIG_FILE" 2>/dev/null; then
  echo "ERROR:User already exists"
  exit 1
fi

sed -i '/#vless$/a\\### '"$user $exp_date"'\\
},{"id": "'"$uuid"'","email": "'"$user"'"' "$CONFIG_FILE" 2>/dev/null || sed -i '/#vless/a\\### '"$user $exp_date"'\\
},{"id": "'"$uuid"'","email": "'"$user"'"' "$CONFIG_FILE" 2>/dev/null || true

sed -i '/#vlessgrpc$/a\\### '"$user $exp_date"'\\
},{"id": "'"$uuid"'","email": "'"$user"'"' "$CONFIG_FILE" 2>/dev/null || true

if [ "$quota" != "0" ]; then
  quota_bytes=$((quota * 1024 * 1024 * 1024))
  mkdir -p /etc/xray/vless
  echo "$quota_bytes" > /etc/xray/vless/\${user} 2>/dev/null || true
  echo "$ip_limit" > /etc/xray/vless/\${user}IP 2>/dev/null || true
fi

db_file="/etc/xray/vless/.vless.db"
mkdir -p /etc/xray/vless
touch $db_file 2>/dev/null || true
grep -v "^### \${user} " "$db_file" > "$db_file.tmp" 2>/dev/null || true
mv "$db_file.tmp" "$db_file" 2>/dev/null || true
echo "### \${user} \${exp_date} \${uuid}" >> "$db_file" 2>/dev/null || true

systemctl restart xray 2>/dev/null || systemctl restart vless@config 2>/dev/null || systemctl restart xray@vless 2>/dev/null || true

vless_tls="vless://\${uuid}@\${domain}:443?encryption=none&security=tls&sni=\${domain}&type=ws&host=\${domain}&path=%2Fwhatever%2Fvless#\${user}"
vless_ntls="vless://\${uuid}@\${domain}:80?encryption=none&security=none&type=ws&host=\${domain}&path=%2Fwhatever%2Fvless#\${user}"
vless_grpc="vless://\${uuid}@\${domain}:443?encryption=none&security=tls&type=grpc&serviceName=vless-grpc&sni=\${domain}#\${user}"

cat <<RESULT
{
  "status": "success",
  "username": "$user",
  "uuid": "$uuid",
  "domain": "$domain",
  "city": "$city",
  "expired": "$exp_date",
  "quota": "\${quota} GB",
  "ip_limit": "\${ip_limit}",
  "tls_link": "$vless_tls",
  "ntls_link": "$vless_ntls",
  "grpc_link": "$vless_grpc"
}
RESULT
`.trim();
}

export async function createVLessAccount(server: SSHServerConfig, params: CreateProtocolParams): Promise<ProtocolResult> {
  const uuid = crypto.randomUUID();
  const expDate = new Date();
  expDate.setDate(expDate.getDate() + params.durationDays);
  const expFormatted = expDate.toISOString().split("T")[0];

  const script = buildVLessCreateScript({
    username: params.username,
    uuid,
    expFormatted,
    quotaGb: params.quotaGb,
    iplimit: params.iplimit
  });

  const res = await executeSSHCommand(server, script);
  if (res.code !== 0 || !res.stdout.includes('"status": "success"')) {
    return {
      success: false,
      username: params.username,
      domain: server.domain,
      error: res.stdout.includes("User already exists") ? "Username sudah digunakan." : "Gagal membuat akun VLess di server."
    };
  }

  const jsonMatch = res.stdout.match(/\{[\s\S]*\}/);
  const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

  return {
    success: true,
    username: params.username,
    domain: server.domain,
    expired_at: expFormatted,
    credentials: {
      uuid,
      quota: data.quota,
      iplimit: data.ip_limit,
      city: data.city,
      domain: server.domain,
      expired: data.expired
    },
    links: {
      tls: data.tls_link,
      nontls: data.ntls_link,
      grpc: data.grpc_link
    },
    rawOutput: res.stdout
  };
}
