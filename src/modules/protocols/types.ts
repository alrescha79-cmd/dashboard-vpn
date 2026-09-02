export interface CreateProtocolParams {
  username: string;
  password?: string;
  durationDays: number;
  quotaGb: number;
  iplimit: number;
}

export interface ProtocolResult {
  success: boolean;
  username: string;
  domain: string;
  expired_at?: string;
  credentials?: Record<string, any>;
  links?: Record<string, string>;
  rawOutput?: string;
  error?: string;
}
