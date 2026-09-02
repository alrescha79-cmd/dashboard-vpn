import { executeSSHCommand, type SSHServerConfig } from "../../lib/ssh";
import type { CreateProtocolParams, ProtocolResult } from "./types";

export function buildVMessCreateScript(p: { username: string; uuid: string; expFormatted: string; quotaGb: number; iplimit: number }): string {
  return `
user="${p.username}"
uuid="${p.uuid}"
exp_date="${p.expFormatted}"
quota=${p.quotaGb}
ip_limit=${p.iplimit}
domain=$(cat /etc/xray/domain 2>/dev/null || hostname -f)
city=$(cat /etc/xray/city 2>/dev/null || echo "Unknown")
pubkey=$(cat /etc/slowdns/server.pub 2>/dev/null || echo "")

if [ ! -f "/etc/xray/vmess/config.json" ]; then
  if [ -f "/etc/xray/config.json" ]; then
    CONFIG_FILE="/etc/xray/config.json"
  else
    mkdir -p /etc/xray/vmess
    echo '{"inbounds":[]}' > /etc/xray/vmess/config.json
    CONFIG_FILE="/etc/xray/vmess/config.json"
  fi
else
  CONFIG_FILE="/etc/xray/vmess/config.json"
fi

if grep -q "^### $user " "$CONFIG_FILE" 2>/dev/null; then
  echo "ERROR:User already exists"
  exit 1
fi

sed -i '/#vmess$/a\\### '"$user $exp_date"'\\
},{"id": "'"$uuid"'","email": "'"$user"'"' "$CONFIG_FILE" 2>/dev/null || sed -i '/#vmess/a\\### '"$user $exp_date"'\\
},{"id": "'"$uuid"'","email": "'"$user"'"' "$CONFIG_FILE" 2>/dev/null || true

sed -i '/#vmessgrpc$/a\\### '"$user $exp_date"'\\
},{"id": "'"$uuid"'","email": "'"$user"'"' "$CONFIG_FILE" 2>/dev/null || true

if [ "$quota" != "0" ]; then
  quota_bytes=$((quota * 1024 * 1024 * 1024))
  mkdir -p /etc/xray/vmess
  echo "$quota_bytes" > /etc/xray/vmess/\${user} 2>/dev/null || true
  echo "$ip_limit" > /etc/xray/vmess/\${user}IP 2>/dev/null || true
fi

db_file="/etc/xray/vmess/.vmess.db"
mkdir -p /etc/xray/vmess
touch $db_file 2>/dev/null || true
grep -v "^### \${user} " "$db_file" > "$db_file.tmp" 2>/dev/null || true
mv "$db_file.tmp" "$db_file" 2>/dev/null || true
echo "### \${user} \${exp_date} \${uuid}" >> "$db_file" 2>/dev/null || true

systemctl restart vmess@config 2>/dev/null || systemctl restart xray@vmess 2>/dev/null || systemctl restart xray 2>/dev/null || true

vmess_tls=$(cat <<VMESS_EOF | base64 -w 0
{
  "v": "2",
  "ps": "\${user}",
  "add": "\${domain}",
  "port": "443",
  "id": "\${uuid}",
  "aid": "0",
  "net": "ws",
  "path": "/whatever/vmess",
  "type": "none",
  "host": "\${domain}",
  "tls": "tls"
}
VMESS_EOF
)

vmess_ntls=$(cat <<VMESS_EOF | base64 -w 0
{
  "v": "2",
  "ps": "\${user}",
  "add": "\${domain}",
  "port": "80",
  "id": "\${uuid}",
  "aid": "0",
  "net": "ws",
  "path": "/whatever/vmess",
  "type": "none",
  "host": "\${domain}",
  "tls": ""
}
VMESS_EOF
)

vmess_grpc=$(cat <<VMESS_EOF | base64 -w 0
{
  "v": "2",
  "ps": "\${user}",
  "add": "\${domain}",
  "port": "443",
  "id": "\${uuid}",
  "aid": "0",
  "net": "grpc",
  "path": "",
  "type": "gun",
  "host": "\${domain}",
  "tls": "tls",
  "sni": "\${domain}",
  "serviceName": "vmess-grpc"
}
VMESS_EOF
)

cat <<RESULT
{
  "status": "success",
  "username": "$user",
  "uuid": "$uuid",
  "domain": "$domain",
  "city": "$city",
  "pubkey": "$pubkey",
  "expired": "$exp_date",
  "quota": "\${quota} GB",
  "ip_limit": "\${ip_limit}",
  "tls_link": "vmess://$vmess_tls",
  "ntls_link": "vmess://$vmess_ntls",
  "grpc_link": "vmess://$vmess_grpc"
}
RESULT
`.trim();
}

export async function createVMessAccount(server: SSHServerConfig, params: CreateProtocolParams): Promise<ProtocolResult> {
  const uuid = crypto.randomUUID();
  const expDate = new Date();
  expDate.setDate(expDate.getDate() + params.durationDays);
  const expFormatted = expDate.toISOString().split("T")[0];

  const script = buildVMessCreateScript({
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
      error: res.stdout.includes("User already exists") ? "Username sudah digunakan." : "Gagal membuat akun VMess di server."
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
      uuid: data.uuid || uuid,
      quota: data.quota,
      iplimit: data.ip_limit,
      city: data.city,
      domain: server.domain
    },
    links: {
      tls: data.tls_link,
      nontls: data.ntls_link,
      grpc: data.grpc_link
    },
    rawOutput: res.stdout
  };
}
