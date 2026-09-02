import { executeSSHCommand, type SSHServerConfig } from "../../lib/ssh";
import type { CreateProtocolParams, ProtocolResult } from "./types";

export function buildTrojanCreateScript(p: { username: string; uuid: string; expFormatted: string; quotaGb: number; iplimit: number }): string {
  return `
user="${p.username}"
uuid="${p.uuid}"
exp_date="${p.expFormatted}"
quota=${p.quotaGb}
ip_limit=${p.iplimit}
domain=$(cat /etc/xray/domain 2>/dev/null || hostname -f)
city=$(cat /etc/xray/city 2>/dev/null || echo "Unknown")
pubkey=$(cat /etc/slowdns/server.pub 2>/dev/null || echo "")

if [ ! -f "/etc/xray/trojan/config.json" ]; then
  if [ -f "/etc/xray/config.json" ]; then
    CONFIG_FILE="/etc/xray/config.json"
  else
    mkdir -p /etc/xray/trojan
    echo '{"inbounds":[]}' > /etc/xray/trojan/config.json
    CONFIG_FILE="/etc/xray/trojan/config.json"
  fi
else
  CONFIG_FILE="/etc/xray/trojan/config.json"
fi

if grep -q "^### $user " "$CONFIG_FILE" 2>/dev/null; then
  echo "ERROR:User already exists"
  exit 1
fi

sed -i '/#trojan$/a\\### '"$user $exp_date"'\\
},{"password": "'"$uuid"'","email": "'"$user"'"' "$CONFIG_FILE" 2>/dev/null || sed -i '/#trojan/a\\### '"$user $exp_date"'\\
},{"password": "'"$uuid"'","email": "'"$user"'"' "$CONFIG_FILE" 2>/dev/null || true

sed -i '/#trojangrpc$/a\\### '"$user $exp_date"'\\
},{"password": "'"$uuid"'","email": "'"$user"'"' "$CONFIG_FILE" 2>/dev/null || true

if [ "$quota" != "0" ]; then
  quota_bytes=$((quota * 1024 * 1024 * 1024))
  mkdir -p /etc/xray/trojan
  echo "$quota_bytes" > /etc/xray/trojan/\${user} 2>/dev/null || true
  echo "$ip_limit" > /etc/xray/trojan/\${user}IP 2>/dev/null || true
fi

db_file="/etc/xray/trojan/.trojan.db"
mkdir -p /etc/xray/trojan
touch $db_file 2>/dev/null || true
grep -v "^### \${user} " "$db_file" > "$db_file.tmp" 2>/dev/null || true
mv "$db_file.tmp" "$db_file" 2>/dev/null || true
echo "### \${user} \${exp_date} \${uuid}" >> "$db_file" 2>/dev/null || true

systemctl restart xray 2>/dev/null || systemctl restart trojan@config 2>/dev/null || systemctl restart xray@trojan 2>/dev/null || true

trojan_tls="trojan://\${uuid}@\${domain}:443?path=/trojan-ws&security=tls&host=\${domain}&type=ws&sni=\${domain}#\${user}"
trojan_grpc="trojan://\${uuid}@\${domain}:443?mode=gun&security=tls&type=grpc&serviceName=trojan-grpc&sni=\${domain}#\${user}"

cat <<RESULT
{
  "status": "success",
  "username": "$user",
  "password": "$uuid",
  "domain": "$domain",
  "city": "$city",
  "pubkey": "$pubkey",
  "expired": "$exp_date",
  "quota": "\${quota} GB",
  "ip_limit": "\${ip_limit}",
  "tls_link": "$trojan_tls",
  "grpc_link": "$trojan_grpc"
}
RESULT
`.trim();
}

export async function createTrojanAccount(server: SSHServerConfig, params: CreateProtocolParams): Promise<ProtocolResult> {
  const uuid = crypto.randomUUID();
  const expDate = new Date();
  expDate.setDate(expDate.getDate() + params.durationDays);
  const expFormatted = expDate.toISOString().split("T")[0];

  const script = buildTrojanCreateScript({
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
      error: res.stdout.includes("User already exists") ? "Username sudah digunakan." : "Gagal membuat akun Trojan di server."
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
      password: data.password || uuid,
      quota: data.quota,
      iplimit: data.ip_limit,
      city: data.city,
      domain: server.domain
    },
    links: {
      tls: data.tls_link,
      grpc: data.grpc_link
    },
    rawOutput: res.stdout
  };
}
