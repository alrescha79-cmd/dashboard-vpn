import React, { useState } from "react";
import { Copy, Check, ExternalLink, Shield } from "lucide-react";

interface AccountDetailsCardProps {
  title: string;
  headerTone?: "emerald" | "amber";
  account: {
    username: string;
    protocol: string;
    expired_at?: string;
    domain?: string;
    credentials?: Record<string, any>;
    links?: Record<string, string>;
    raw?: string;
  };
  serverMeta?: {
    domain?: string;
    nama_server?: string;
    lokasi?: string;
    isp?: string;
  };
  actions?: React.ReactNode;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-black font-heading tracking-wider uppercase text-neutral-700 dark:text-neutral-300 mb-2">{children}</div>;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm border-b border-kawaii-ink/10 dark:border-white/10 last:border-0">
      <span className="text-neutral-700 dark:text-neutral-300 font-medium">{label}</span>
      <span className="font-bold text-kawaii-ink dark:text-white">{value ?? "—"}</span>
    </div>
  );
}

function CopyLinkRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="bg-kawaii-card dark:bg-kawaii-darkCard border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm dark:shadow-kawaii-dark-sm rounded-2xl p-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[11px] uppercase font-black text-neutral-600 dark:text-neutral-400 font-heading">{label}</div>
        <div className="font-mono text-xs text-kawaii-ink dark:text-white font-black truncate">{value}</div>
      </div>
      <button
        onClick={() => {
          navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        }}
        className="shrink-0 px-3.5 py-1.5 rounded-xl bg-kawaii-yellow hover:bg-kawaii-yellowDark text-xs font-black text-kawaii-ink border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5 transition-all"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-kawaii-ink stroke-[3]" /> : <Copy className="h-3.5 w-3.5 stroke-[2.5]" />}
        <span>{copied ? "Tersalin!" : "Salin"}</span>
      </button>
    </div>
  );
}

export const AccountDetailsCard: React.FC<AccountDetailsCardProps> = ({
  title,
  headerTone = "emerald",
  account,
  serverMeta,
  actions
}) => {
  const creds = account.credentials || {};
  const links = account.links || {};
  const domain = account.domain || serverMeta?.domain || creds.domain || "—";
  const isSSH = account.protocol?.toLowerCase() === "ssh";
  const quotaLabel = creds.quota || creds.quotaLabel || (creds.quota === 0 ? "Unlimited" : creds.quota) || "Unlimited";
  const iplimitLabel = creds.iplimit ?? creds.ip_limit ?? creds.iplimitLabel ?? "1";

  const badgeBg = headerTone === "amber" ? "bg-kawaii-yellow" : "bg-kawaii-green";

  return (
    <div className="p-6 bg-kawaii-card dark:bg-kawaii-darkCard border-4 border-kawaii-ink dark:border-white rounded-3xl shadow-kawaii dark:shadow-kawaii-dark space-y-5">
      <div className="flex items-center justify-between font-black text-base text-kawaii-ink dark:text-white font-heading">
        <div className="flex items-center gap-2">
          <span className={`p-1.5 ${badgeBg} rounded-xl border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm`}>
            <Shield className="h-4 w-4 text-kawaii-ink stroke-[2.5]" />
          </span>
          <span>{title}</span>
        </div>
        <span className="px-3.5 py-1 rounded-full bg-kawaii-peach text-kawaii-ink border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm text-xs font-black uppercase">
          {account.protocol}
        </span>
      </div>

      {/* Summary sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-kawaii-subtle dark:bg-kawaii-darkSubtle border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm rounded-2xl p-4">
          <SectionLabel>Informasi Akun</SectionLabel>
          <Field label="Username" value={<span className="font-mono font-bold bg-kawaii-card dark:bg-kawaii-darkCard dark:text-white px-2 py-0.5 rounded-lg border-2 border-kawaii-ink dark:border-white">{account.username}</span>} />
          {isSSH && <Field label="Password" value={<span className="font-mono font-bold bg-kawaii-card dark:bg-kawaii-darkCard dark:text-white px-2 py-0.5 rounded-lg border-2 border-kawaii-ink dark:border-white">{creds.password || "—"}</span>} />}
          {!isSSH && creds.uuid && <Field label="UUID" value={<span className="font-mono font-bold text-xs break-all bg-kawaii-card dark:bg-kawaii-darkCard dark:text-white p-1 rounded-lg border-2 border-kawaii-ink dark:border-white">{creds.uuid}</span>} />}
          {creds.password && !isSSH && <Field label="Password" value={<span className="font-mono font-bold text-xs bg-kawaii-card dark:bg-kawaii-darkCard dark:text-white px-2 py-0.5 rounded-lg border-2 border-kawaii-ink dark:border-white">{creds.password}</span>} />}
          <Field label="Protokol" value={<span className="uppercase font-black">{account.protocol}</span>} />
          <Field label="Kedaluwarsa" value={<span className="font-mono font-black text-kawaii-ink dark:text-white">{account.expired_at || "—"}</span>} />
        </div>

        <div className="bg-kawaii-subtle dark:bg-kawaii-darkSubtle border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm rounded-2xl p-4">
          <SectionLabel>Server & Jaringan</SectionLabel>
          <Field label="Domain" value={<span className="font-mono text-xs font-black">{domain}</span>} />
          <Field label="Lokasi / ISP" value={`${serverMeta?.lokasi || creds.city || "—"} - ${serverMeta?.isp || "—"}`} />
          <Field label="Ports" value={isSSH ? "22, 80, 443, 8080" : "443 (TLS) / 80 (Non-TLS)"} />
          <Field label="Method" value={creds.method || (account.protocol === "shadowsocks" ? "aes-128-gcm" : isSSH ? "SSH" : "WebSocket / gRPC")} />
          <Field label="Path" value={<span className="font-mono text-xs font-bold">/whatever/{account.protocol.toLowerCase()}</span>} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-kawaii-subtle dark:bg-kawaii-darkSubtle border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm rounded-2xl p-4">
          <SectionLabel>Batas Penggunaan</SectionLabel>
          <Field label="Kuota" value={String(quotaLabel)} />
          <Field label="IP Limit" value={String(iplimitLabel) + " perangkat"} />
          {creds.city && <Field label="Kota / Node" value={creds.city} />}
        </div>
        <div className="bg-kawaii-subtle dark:bg-kawaii-darkSubtle border-3 border-kawaii-ink dark:border-white shadow-kawaii-sm rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <SectionLabel>Tautan Konfigurasi</SectionLabel>
            {creds.save_link ? (
              <a
                href={creds.save_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-black text-kawaii-ink hover:underline inline-flex items-center gap-1.5 mt-1 bg-kawaii-blue px-3.5 py-2 rounded-2xl border-2 border-kawaii-ink dark:border-white shadow-kawaii-sm"
              >
                <ExternalLink className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Unduh file .txt konfigurasi</span>
              </a>
            ) : (
              <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Tautan unduhan tidak tersedia</div>
            )}
          </div>
        </div>
      </div>

      {/* Import URLs */}
      <div className="space-y-2">
        <SectionLabel>URL Impor & Konfigurasi</SectionLabel>
        {Object.keys(links).length === 0 && Object.keys(creds).length === 0 && (
          <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Tidak ada URL impor yang tersedia.</div>
        )}
        {Object.entries(links).map(([k, v]) => (
          <CopyLinkRow key={k} label={k} value={String(v)} />
        ))}
        {Object.keys(links).length === 0 && isSSH === false && creds.uuid && (
          <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Gunakan UUID/password di atas untuk konfigurasi manual.</div>
        )}
      </div>

      {actions && <div>{actions}</div>}
    </div>
  );
};
