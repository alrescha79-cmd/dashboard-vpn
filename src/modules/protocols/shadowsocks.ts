import { executeSSHCommand, type SSHServerConfig } from "../../lib/ssh";
import type { CreateProtocolParams, ProtocolResult } from "./types";

export function buildShadowsocksCreateScript(p: { username: string; uuid: string; expFormatted: string; quotaGb: number; iplimit: number }): string {
  return `
user="${p.username}"
uuid="${p.uuid}"
exp_date="${p.expFormatted}"
quota=${p.quotaGb}
ip_limit=${p.iplimit}
domain=$(cat /etc/xray/domain 2>/dev/null || hostname -f)
city=$(cat /etc/xray/city 2>/dev/null || echo "Unknown")
pubkey=$(cat /etc/slowdns/server.pub 2>/dev/null || echo "")

if [ ! -f "/etc/xray/shadowsocks/config.json" ]; then
  if [ -f "/etc/xray/config.json" ]; then
    CONFIG_FILE="/etc/xray/config.json"
  else
    mkdir -p /etc/xray/shadowsocks
    echo '{"inbounds":[]}' > /etc/xray/shadowsocks/config.json
    CONFIG_FILE="/etc/xray/shadowsocks/config.json"
  fi
else
  CONFIG_FILE="/etc/xray/shadowsocks/config.json"
fi

if grep -q "^### $user " "$CONFIG_FILE" 2>/dev/null; then
  echo "ERROR:User already exists"
  exit 1
fi

sed -i '/#shadowsocks$/a\\### '"$user $exp_date"'\\
},{"password": "'"$uuid"'","email": "'"$user"'","method": "aes-128-gcm"' "$CONFIG_FILE" 2>/dev/null || sed -i '/#shadowsocks/a\\### '"$user $exp_date"'\\
},{"password": "'"$uuid"'","email": "'"$user"'","method": "aes-128-gcm"' "$CONFIG_FILE" 2>/dev/null || true

sed -i '/#shadowsocksgrpc$/a\\### '"$user $exp_date"'\\
},{"password": "'"$uuid"'","email": "'"$user"'","method": "aes-128-gcm"' "$CONFIG_FILE" 2>/dev/null || true

ss_base64=$(echo -n "aes-128-gcm:\${uuid}" | base64 -w0)

if [ "$quota" != "0" ]; then
  quota_bytes=$((quota * 1024 * 1024 * 1024))
  mkdir -p /etc/xray/shadowsocks
  echo "$quota_bytes" > /etc/xray/shadowsocks/\${user} 2>/dev/null || true
  echo "$ip_limit" > /etc/xray/shadowsocks/\${user}IP 2>/dev/null || true
fi

db_file="/etc/xray/shadowsocks/.shadowsocks.db"
mkdir -p /etc/xray/shadowsocks
touch $db_file 2>/dev/null || true
grep -v "^### \${user} " "$db_file" > "$db_file.tmp" 2>/dev/null || true
mv "$db_file.tmp" "$db_file" 2>/dev/null || true
echo "### \${user} \${exp_date} \${uuid}" >> "$db_file" 2>/dev/null || true

systemctl restart xray 2>/dev/null || systemctl restart shadowsocks@config 2>/dev/null || systemctl restart xray@shadowsocks 2>/dev/null || true

ss_tls="ss://\${ss_base64}@\${domain}:443#\${user}"
ss_grpc="ss://\${ss_base64}@\${domain}:443?plugin=grpc#\${user}"

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
  "method": "aes-128-gcm",
  "tls_link": "$ss_tls",
  "grpc_link": "$ss_grpc"
}
RESULT
`.trim();
}

export async function createShadowsocksAccount(server: SSHServerConfig, params: CreateProtocolParams): Promise<ProtocolResult> {
  const uuid = crypto.randomUUID();
  const expDate = new Date();
  expDate.setDate(expDate.getDate() + params.durationDays);
  const expFormatted = expDate.toISOString().split("T")[0];

  const script = buildShadowsocksCreateScript({
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
      error: res.stdout.includes("User already exists") ? "Username sudah digunakan." : "Gagal membuat akun Shadowsocks di server."
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
      method: data.method || "aes-128-gcm",
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
