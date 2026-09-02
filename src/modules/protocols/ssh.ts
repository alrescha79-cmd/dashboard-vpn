import { executeSSHCommand, type SSHServerConfig } from "../../lib/ssh";
import type { CreateProtocolParams, ProtocolResult } from "./types";

export function buildSSHCreateScript(params: { username: string; password?: string; expFormatted: string; iplimit: number }): string {
  return `
username="${params.username}"
password="${params.password || ""}"
expFormatted="${params.expFormatted}"
iplimit=${params.iplimit}

if id "$username" &>/dev/null; then
  echo "ERROR:User already exists"
  exit 1
fi

useradd -M -N -s /bin/false -e "$expFormatted" "$username" || exit 1
echo "$username:$password" | chpasswd || exit 1
mkdir -p /etc/ssh
echo "### $username $expFormatted $iplimit" >> /etc/ssh/.ssh.db
echo "SUCCESS"
`.trim();
}

export function buildSSHRenewScript(params: { username: string; expDays: number; iplimit: number }): string {
  return `
user="${params.username}"
exp_days=${params.expDays}
ip_limit=${params.iplimit}

if ! id "$user" &>/dev/null; then
  echo "ERROR:User not found"
  exit 1
fi

old_exp=$(chage -l "$user" | grep "Account expires" | cut -d: -f2 | xargs)
if [ -z "$old_exp" ] || [ "$old_exp" = "never" ]; then
  new_exp=$(date -d "+${exp_days} days" +"%Y-%m-%d")
else
  old_date=$(date -d "$old_exp" +"%Y-%m-%d")
  new_exp=$(date -d "$old_date +${exp_days} days" +"%Y-%m-%d")
fi

chage -E "$new_exp" "$user"
mkdir -p /etc/ssh/limit
echo "$ip_limit" > /etc/ssh/limit/$user
sed -i "/^### $user /d" /etc/ssh/.ssh.db
echo "### $user $new_exp $ip_limit" >> /etc/ssh/.ssh.db

echo "SUCCESS"
`.trim();
}

export function buildSSHDeleteScript(username: string): string {
  return `
user="${username}"
userdel -r "$user" 2>/dev/null || userdel "$user" 2>/dev/null || true
rm -f /etc/ssh/limit/$user /var/www/html/ssh-$user.txt
sed -i "/^### $user /d" /etc/ssh/.ssh.db
echo "SUCCESS"
`.trim();
}

export async function createSSHAccount(server: SSHServerConfig, params: CreateProtocolParams): Promise<ProtocolResult> {
  const expDate = new Date();
  expDate.setDate(expDate.getDate() + params.durationDays);
  const expFormatted = expDate.toISOString().split("T")[0];

  const effectivePassword = params.password && params.password.length >= 4 ? params.password : `${params.username}_pass`;

  const script = buildSSHCreateScript({
    username: params.username,
    password: effectivePassword,
    expFormatted,
    iplimit: params.iplimit
  });

  const res = await executeSSHCommand(server, script);
  if (res.code !== 0 || !res.stdout.includes("SUCCESS")) {
    return {
      success: false,
      username: params.username,
      domain: server.domain,
      error: res.stdout.includes("User already exists") ? "Username sudah digunakan." : "Gagal membuat akun SSH di server."
    };
  }

  return {
    success: true,
    username: params.username,
    domain: server.domain,
    expired_at: expFormatted,
    credentials: {
      password: effectivePassword,
      ports: "22, 80, 443, 8080",
      domain: server.domain,
      iplimit: params.iplimit,
      save_link: `https://${server.domain}:81/ssh-${params.username}.txt`
    },
    rawOutput: res.stdout
  };
}
