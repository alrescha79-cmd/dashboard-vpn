import { createSSHAccount, buildSSHRenewScript, buildSSHDeleteScript } from "./ssh";
import { createVMessAccount } from "./vmess";
import { createVLessAccount } from "./vless";
import { createTrojanAccount } from "./trojan";
import { createShadowsocksAccount } from "./shadowsocks";
import { createThreeInOneAccount } from "./threeinone";
import { executeSSHCommand, type SSHServerConfig } from "../../lib/ssh";
import type { CreateProtocolParams, ProtocolResult } from "./types";

export * from "./types";
export * from "./ssh";
export * from "./vmess";
export * from "./vless";
export * from "./trojan";
export * from "./shadowsocks";
export * from "./threeinone";

export async function createVPNAccount(
  protocol: string,
  server: SSHServerConfig,
  params: CreateProtocolParams
): Promise<ProtocolResult> {
  const p = protocol.toLowerCase();
  switch (p) {
    case "ssh":
      return createSSHAccount(server, params);
    case "vmess":
      return createVMessAccount(server, params);
    case "vless":
      return createVLessAccount(server, params);
    case "trojan":
      return createTrojanAccount(server, params);
    case "shadowsocks":
      return createShadowsocksAccount(server, params);
    case "3in1":
      return createThreeInOneAccount(server, params);
    default:
      return {
        success: false,
        username: params.username,
        domain: server.domain,
        error: `Protokol ${protocol} tidak didukung`
      };
  }
}

export async function deleteVPNAccount(
  protocol: string,
  server: SSHServerConfig,
  username: string
): Promise<boolean> {
  const p = protocol.toLowerCase();
  let script = "";
  if (p === "ssh") {
    script = buildSSHDeleteScript(username);
  } else {
    script = `
user="${username}"
for proto in vmess vless trojan shadowsocks; do
  sed -i "/^### $user /d" /etc/xray/$proto/config.json 2>/dev/null || true
  sed -i "/^### $user /d" /etc/xray/config.json 2>/dev/null || true
  rm -f /etc/xray/$proto/$user /etc/xray/$proto/\${user}IP 2>/dev/null || true
done
systemctl restart xray 2>/dev/null || true
echo "SUCCESS"
`.trim();
  }

  try {
    const res = await executeSSHCommand(server, script);
    return res.code === 0 && res.stdout.includes("SUCCESS");
  } catch {
    return false;
  }
}
