export interface HashEntry {
  url: string;
  hash: string;
  timestamp: number;
  verified?: boolean;
  contractHash?: string;
}

export interface SiteHashes {
  [hostname: string]: HashEntry[];
}

export interface SiteVerification {
  isVerified: boolean;
  totalFiles: number;
  verifiedFiles: number;
  lastVerified: number;
}

export interface VerificationStatus {
  [hostname: string]: SiteVerification;
}

export interface MessageResponse {
  status: string;
  timestamp: string;
} 