import { describe, expect, it } from "bun:test";
import { buildSSHCreateScript } from "../src/modules/protocols/ssh";
import { buildVMessCreateScript } from "../src/modules/protocols/vmess";
import { buildVLessCreateScript } from "../src/modules/protocols/vless";
import { buildTrojanCreateScript } from "../src/modules/protocols/trojan";
import { buildShadowsocksCreateScript } from "../src/modules/protocols/shadowsocks";

describe("VPN Protocol Script Builders", () => {
  it("builds SSH create command", () => {
    const s = buildSSHCreateScript({ username: "usr1", password: "pwd", expFormatted: "2026-10-01", iplimit: 2 });
    expect(s).toContain("useradd");
    expect(s).toContain("usr1");
  });

  it("builds VMess xray sed commands", () => {
    const s = buildVMessCreateScript({ username: "usr1", uuid: "123-uuid", expFormatted: "2026-10-01", quotaGb: 10, iplimit: 2 });
    expect(s).toContain("#vmess$");
    expect(s).toContain("vmess://");
  });

  it("builds VLess & Trojan links correctly", () => {
    const vless = buildVLessCreateScript({ username: "usr1", uuid: "123-uuid", expFormatted: "2026-10-01", quotaGb: 0, iplimit: 0 });
    expect(vless).toContain("vless://");

    const trojan = buildTrojanCreateScript({ username: "usr1", uuid: "123-uuid", expFormatted: "2026-10-01", quotaGb: 0, iplimit: 0 });
    expect(trojan).toContain("trojan://");
  });

  it("builds Shadowsocks aes-128-gcm command", () => {
    const ss = buildShadowsocksCreateScript({ username: "usr1", uuid: "123-uuid", expFormatted: "2026-10-01", quotaGb: 0, iplimit: 0 });
    expect(ss).toContain("aes-128-gcm");
    expect(ss).toContain("ss://");
  });
});
