import { executeSSHCommand, type SSHServerConfig } from "../../lib/ssh";
import type { CreateProtocolParams, ProtocolResult } from "./types";

export async function createThreeInOneAccount(server: SSHServerConfig, params: CreateProtocolParams): Promise<ProtocolResult> {
  const uuid = crypto.randomUUID();
  const expDate = new Date();
  expDate.setDate(expDate.getDate() + params.durationDays);
  const expFormatted = expDate.toISOString().split("T")[0];

  const script = `
user="${params.username}"
uuid="${uuid}"
exp_date="${expFormatted}"
quota=${params.quotaGb}
ip_limit=${params.iplimit}
domain=$(cat /etc/xray/domain 2>/dev/null || hostname -f)
city=$(cat /etc/xray/city 2>/dev/null || echo "Unknown")

for proto in vmess vless trojan; do
  mkdir -p /etc/xray/$proto
    _CONFIG_FILE="/etc/xray/$proto/config.json"
  if [ ! -f "$_CONFIG_FILE" ]; then
    if [ -f "/etc/xray/config.json" ]; then
      _CONFIG_FILE="/etc/xray/config.json"
    else
      echo '{"inbounds":[]}' > /etc/xray/$proto/config.json
      _CONFIG_FILE="/etc/xray/$proto/config.json"
    fi
  fi
  CONFIG_FILE="$_CONFIG_FILE"

  if grep -q "^### \${user} " "$CONFIG_FILE" 2>/dev/null; then
    echo "ERROR:User already exists ($proto)"
    exit 1
  fi

  _marker="#$proto"
  sed -i "/$_marker\$/a\\\\### \${user} \${exp_date}\\\\
},{\\"id\\": \\"\${uuid}\\",\\"password\\": \\"\${uuid}\\",\\"email\\": \\"\${user}\\"" "$CONFIG_FILE" 2>/dev/null || sed -i "/$_marker/a\\\\### \${user} \${exp_date}\\\\
},{\\"id\\": \\"\${uuid}\\",\\"password\\": \\"\${uuid}\\",\\"email\\": \\"\${user}\\"" "$CONFIG_FILE" 2>/dev/null || true

  _grpc_marker="#\${proto}grpc"
  sed -i "/$_grpc_marker\$/a\\\\### \${user} \${exp_date}\\\\
},{\\"id\\": \\"\${uuid}\\",\\"password\\": \\"\${uuid}\\",\\"email\\": \\"\${user}\\"" "$CONFIG_FILE" 2>/dev/null || true

  if [ "$quota" != "0" ]; then
    quota_bytes=$((quota * 1024 * 1024 * 1024))
    mkdir -p /etc/xray/$proto
    echo "$quota_bytes" > /etc/xray/$proto/\${user} 2>/dev/null || true
    echo "$ip_limit" > /etc/xray/$proto/\${user}IP 2>/dev/null || true
  fi

  _db_file="/etc/xray/$proto/.\${proto}.db"
  mkdir -p /etc/xray/$proto 2>/dev/null
  touch "$_db_file" 2>/dev/null || true
  grep -v "^### \${user} " "$_db_file" > "$_db_file.tmp" 2>/dev/null || true
  mv "$_db_file.tmp" "$_db_file" 2>/dev/null || true
  echo "### \${user} \${exp_date} \${uuid}" >> "$_db_file" 2>/dev/null || true
done

systemctl restart xray 2>/dev/null || { systemctl restart vmess@config; systemctl restart vless@config; systemctl restart trojan@config; } 2>/dev/null || true

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
  "type": "gun",
  "host": "\${domain}",
  "tls": "tls",
  "sni": "\${domain}",
  "serviceName": "vmess-grpc"
}
VMESS_EOF
)
vless_tls="vless://\${uuid}@\${domain}:443?encryption=none&security=tls&sni=\${domain}&type=ws&host=\${domain}&path=%2Fwhatever%2Fvless#\${user}"
vless_ntls="vless://\${uuid}@\${domain}:80?encryption=none&security=none&type=ws&host=\${domain}&path=%2Fwhatever%2Fvless#\${user}"
vless_grpc="vless://\${uuid}@\${domain}:443?encryption=none&security=tls&type=grpc&serviceName=vless-grpc&sni=\${domain}#\${user}"
trojan_tls="trojan://\${uuid}@\${domain}:443?path=/trojan-ws&security=tls&host=\${domain}&type=ws&sni=\${domain}#\${user}"
trojan_grpc="trojan://\${uuid}@\${domain}:443?mode=gun&security=tls&type=grpc&serviceName=trojan-grpc&sni=\${domain}#\${user}"
ss_base64=$(echo -n "aes-128-gcm:\${uuid}" | base64 -w0)
ss_tls="ss://\${ss_base64}@\${domain}:443#\${user}"

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
  "vmess_tls_link": "vmess://$vmess_tls",
  "vmess_ntls_link": "vmess://$vmess_ntls",
  "vmess_grpc_link": "vmess://$vmess_grpc",
  "vless_tls_link": "$vless_tls",
  "vless_ntls_link": "$vless_ntls",
  "vless_grpc_link": "$vless_grpc",
  "trojan_tls_link": "$trojan_tls",
  "trojan_grpc_link": "$trojan_grpc",
  "ss_link": "$ss_tls"
}
RESULT
`.trim();

  const res = await executeSSHCommand(server, script);
  if (res.code !== 0 || !res.stdout.includes('"status": "success"')) {
    return {
      success: false,
      username: params.username,
      domain: server.domain,
      error: res.stdout.includes("User already exists") ? "Username sudah dipakai." : "Gagal membuat bundle 3IN1 di server."
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
      domain: server.domain
    },
    links: {
      vmess_tls: data.vmess_tls_link,
      vmess_nontls: data.vmess_nontls_link,
      vmess_grpc: data.vmess_grpc_link,
      vless_tls: data.vless_tls_link,
      vless_nontls: data.vless_nontls_link,
      vless_grpc: data.vless_grpc_link,
      trojan_tls: data.trojan_tls_link,
      trojan_grpc: data.trojan_grpc_link,
      ss: data.ss_link
    },
    rawOutput: res.stdout
  };
}
