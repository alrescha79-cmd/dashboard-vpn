import { Client } from "ssh2";

export interface SSHServerConfig {
  domain: string;
  port?: number;
  user_ssh?: string;
  auth: string;
}

export interface SSHExecutionResult {
  code: number;
  stdout: string;
  stderr: string;
}

export function wrapSSHCommand(command: string, userSsh = "root", auth = ""): string {
  if (!userSsh || userSsh.toLowerCase() === "root") {
    return command;
  }
  const base64Cmd = Buffer.from(command).toString("base64");
  const cleanAuth = auth ? auth.replace(/'/g, "'\\''") : "";

  if (cleanAuth) {
    return `echo '${cleanAuth}' | sudo -S -p '' bash -c "$(echo '${base64Cmd}' | base64 -d)"`;
  }
  return `sudo -n bash -c "$(echo '${base64Cmd}' | base64 -d)"`;
}

export function executeSSHCommand(
  server: SSHServerConfig,
  command: string,
  timeoutMs = 35000
): Promise<SSHExecutionResult> {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let resolved = false;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        conn.end();
        reject(new Error(`SSH Connection timeout after ${timeoutMs}ms`));
      }
    }, timeoutMs);

    conn.on("ready", () => {
      const wrapped = wrapSSHCommand(command, server.user_ssh || "root", server.auth);
      conn.exec(wrapped, (err, stream) => {
        if (err) {
          clearTimeout(timer);
          conn.end();
          return reject(err);
        }

        let stdout = "";
        let stderr = "";

        stream.on("data", (d: Buffer) => {
          stdout += d.toString();
        });
        stream.stderr.on("data", (d: Buffer) => {
          stderr += d.toString();
        });

        stream.on("close", (code: number) => {
          clearTimeout(timer);
          conn.end();
          if (!resolved) {
            resolved = true;
            resolve({ code: code ?? 0, stdout, stderr });
          }
        });
      });
    });

    conn.on("error", (err) => {
      clearTimeout(timer);
      if (!resolved) {
        resolved = true;
        reject(err);
      }
    });

    conn.connect({
      host: server.domain,
      port: server.port || 22,
      username: server.user_ssh || "root",
      password: server.auth,
      readyTimeout: timeoutMs,
      keepaliveInterval: 10000
    });
  });
}
