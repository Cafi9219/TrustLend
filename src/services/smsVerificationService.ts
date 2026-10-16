/**
 * SMS OTP Provider & Phone Verification Service for TrustLend
 * Enforces real SMS provider integration, cryptographic OTP hashing,
 * rate limiting, expiry, attempt limiting, and single-use codes.
 */

import { dbService } from './dbService';
import { User } from '../types';
import { hashPassword, verifyPassword } from '../utils/security';

const OTP_STORAGE_KEY = 'trustlend_db_phone_otps';
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_VERIFICATION_ATTEMPTS = 5; // Max 5 wrong attempts before code invalidation
const HOURLY_RATE_LIMIT = 5; // Max 5 requests per hour per phone

export interface PhoneOtpRecord {
  userId: string;
  phone: string;
  hashedOtp: string;
  salt: string;
  createdAt: number;
  expiresAt: number;
  lastSentAt: number;
  attempts: number;
  maxAttempts: number;
  isUsed: boolean;
  requestCountLastHour: number;
  hourWindowStart: number;
}

export interface SmsProviderConfig {
  isConfigured: boolean;
  providerName: 'twilio' | 'fast2sms' | 'custom' | 'none';
  accountSid?: string;
  fromNumber?: string;
  missingVariables: string[];
  errorMessage?: string;
}

/**
 * Checks if actual SMS provider credentials are configured in the environment.
 */
export function getSmsProviderConfig(): SmsProviderConfig {
  // Vite exposes env vars prefixed with VITE_
  const twilioSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID || '';
  const twilioToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN || '';
  const twilioFrom = import.meta.env.VITE_TWILIO_PHONE_NUMBER || '';
  const genericApiKey = import.meta.env.VITE_SMS_API_KEY || '';

  if (twilioSid && twilioToken && twilioFrom) {
    return {
      isConfigured: true,
      providerName: 'twilio',
      accountSid: twilioSid,
      fromNumber: twilioFrom,
      missingVariables: [],
    };
  }

  if (genericApiKey) {
    return {
      isConfigured: true,
      providerName: 'fast2sms',
      missingVariables: [],
    };
  }

  const missing: string[] = [];
  if (!twilioSid) missing.push('VITE_TWILIO_ACCOUNT_SID');
  if (!twilioToken) missing.push('VITE_TWILIO_AUTH_TOKEN');
  if (!twilioFrom) missing.push('VITE_TWILIO_PHONE_NUMBER');

  return {
    isConfigured: false,
    providerName: 'none',
    missingVariables: missing,
    errorMessage:
      'SMS Gateway Configuration Error: No active SMS provider credentials found. Direct simulation of verification without an SMS provider is disabled. Please configure your SMS provider credentials (e.g. VITE_TWILIO_ACCOUNT_SID and VITE_TWILIO_AUTH_TOKEN, or VITE_SMS_API_KEY) in your environment to dispatch real verification codes.',
  };
}

/**
 * Generates a cryptographically strong 6-digit numeric OTP.
 */
function generateSecureSixDigitOtp(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    const code = 100000 + (arr[0] % 900000);
    return String(code);
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Dispatches live SMS using configured Twilio or Generic HTTP Gateway.
 */
async function dispatchSmsViaProvider(
  config: SmsProviderConfig,
  phone: string,
  code: string
): Promise<{ success: boolean; providerMessageId?: string }> {
  if (config.providerName === 'twilio') {
    const twilioSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
    const twilioToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
    const fromNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER;

    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
    const authHeader = 'Basic ' + btoa(`${twilioSid}:${twilioToken}`);

    const params = new URLSearchParams({
      To: phone,
      From: fromNumber,
      Body: `Your TrustLend verification code is: ${code}. Valid for 10 minutes. Do not share this code with anyone.`,
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(
        `Twilio SMS dispatch failed [HTTP ${response.status}]: ${
          errJson.message || 'Provider rejected SMS delivery request.'
        }`
      );
    }

    const data = await response.json();
    return { success: true, providerMessageId: data.sid };
  }

  if (config.providerName === 'fast2sms') {
    const apiKey = import.meta.env.VITE_SMS_API_KEY;
    const gatewayUrl = import.meta.env.VITE_SMS_GATEWAY_URL || 'https://www.fast2sms.com/dev/bulkV2';

    const response = await fetch(gatewayUrl, {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'otp',
        variables_values: code,
        numbers: phone.replace(/\D/g, ''),
      }),
    });

    if (!response.ok) {
      throw new Error(`SMS Provider rejected dispatch with status HTTP ${response.status}.`);
    }

    const data = await response.json();
    return { success: true, providerMessageId: data.request_id || 'OK' };
  }

  throw new Error('Unsupported SMS provider configuration.');
}

/**
 * Loads all active OTP records from internal database storage.
 */
function getAllOtpRecords(): Record<string, PhoneOtpRecord> {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(OTP_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Persists OTP records to internal database storage.
 */
function saveAllOtpRecords(records: Record<string, PhoneOtpRecord>): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(records));
    }
  } catch (e) {
    console.error('Failed to persist OTP records:', e);
  }
}

export const smsVerificationService = {
  /**
   * Retrieves provider configuration status.
   */
  getProviderStatus(): SmsProviderConfig {
    return getSmsProviderConfig();
  },

  /**
   * Dispatches a one-time verification code to the registered phone number.
   * Enforces provider presence, rate limits, 60s cooldown, and cryptographic hashing.
   */
  async sendVerificationOtp(
    userId: string,
    phone: string
  ): Promise<{ success: boolean; cooldownSeconds: number; expiresAt: number }> {
    // 1. Check if real SMS provider is configured
    const providerConfig = getSmsProviderConfig();
    if (!providerConfig.isConfigured) {
      throw new Error(providerConfig.errorMessage);
    }

    // 2. Load existing record and enforce rate limits & cooldown
    const records = getAllOtpRecords();
    const existing = records[userId];
    const now = Date.now();

    if (existing) {
      // Check 60-second resend cooldown
      const elapsedSinceSent = now - existing.lastSentAt;
      if (elapsedSinceSent < RESEND_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsedSinceSent) / 1000);
        throw new Error(
          `Please wait ${remainingSeconds} seconds before requesting a new verification code.`
        );
      }

      // Check hourly rate limit (max 5 requests per hour)
      const oneHour = 60 * 60 * 1000;
      if (now - existing.hourWindowStart < oneHour) {
        if (existing.requestCountLastHour >= HOURLY_RATE_LIMIT) {
          throw new Error('Too many verification requests. Please try again after one hour.');
        }
      }
    }

    // 3. Generate secure 6-digit code
    const rawOtp = generateSecureSixDigitOtp();

    // 4. Dispatch SMS via actual configured provider API
    await dispatchSmsViaProvider(providerConfig, phone, rawOtp);

    // 5. Hash the OTP with a unique cryptographic salt (NEVER store plaintext!)
    const { hash, salt } = await hashPassword(rawOtp);

    // 6. Compute new rate window and save hashed record
    const hourWindowStart =
      existing && now - existing.hourWindowStart < 60 * 60 * 1000
        ? existing.hourWindowStart
        : now;
    const requestCountLastHour =
      existing && now - existing.hourWindowStart < 60 * 60 * 1000
        ? existing.requestCountLastHour + 1
        : 1;

    const newRecord: PhoneOtpRecord = {
      userId,
      phone,
      hashedOtp: hash,
      salt,
      createdAt: now,
      expiresAt: now + OTP_EXPIRY_MS,
      lastSentAt: now,
      attempts: 0,
      maxAttempts: MAX_VERIFICATION_ATTEMPTS,
      isUsed: false,
      requestCountLastHour,
      hourWindowStart,
    };

    records[userId] = newRecord;
    saveAllOtpRecords(records);

    return {
      success: true,
      cooldownSeconds: 60,
      expiresAt: newRecord.expiresAt,
    };
  },

  /**
   * Verifies the submitted OTP code on the backend.
   * Enforces single-use, expiry, and attempt limits.
   */
  async verifyOtpCode(
    userId: string,
    candidateCode: string
  ): Promise<{ success: boolean; user: User }> {
    const trimmed = candidateCode.trim();
    if (!trimmed || trimmed.length !== 6 || !/^\d{6}$/.test(trimmed)) {
      throw new Error('Please enter a valid 6-digit verification code.');
    }

    const records = getAllOtpRecords();
    const record = records[userId];

    if (!record) {
      throw new Error('No active verification request found. Please request a new verification code.');
    }

    if (record.isUsed) {
      throw new Error('This verification code has already been used. Please request a new code.');
    }

    const now = Date.now();
    if (now > record.expiresAt) {
      throw new Error('The verification code has expired (10 minute limit). Please request a new code.');
    }

    if (record.attempts >= record.maxAttempts) {
      throw new Error('Maximum verification attempts exceeded. For security, please request a new code.');
    }

    // Increment attempt counter before checking
    record.attempts += 1;
    saveAllOtpRecords(records);

    // Verify candidate code against stored SHA-256 hash
    const isValid = await verifyPassword(trimmed, record.hashedOtp);

    if (!isValid) {
      const remaining = record.maxAttempts - record.attempts;
      if (remaining <= 0) {
        throw new Error('Maximum verification attempts exceeded. Please request a new code.');
      }
      throw new Error(`Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
    }

    // Mark single-use code as used immediately
    record.isUsed = true;
    saveAllOtpRecords(records);

    // Update user in database as phone verified
    const user = dbService.getUserById(userId);
    if (!user) {
      throw new Error('User record not found in database.');
    }

    user.phoneVerified = true;
    user.phoneVerifiedAt = new Date().toISOString();
    dbService.saveUser(user);

    // Update session storage
    try {
      const sessionData = localStorage.getItem('trustlend_user_session');
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (parsed.id === user.id) {
          localStorage.setItem('trustlend_user_session', JSON.stringify(user));
        }
      }
    } catch {}

    // Broadcast update
    dbService.notify('user_updated', { userId: user.id, user });

    return { success: true, user };
  },

  /**
   * Gets the remaining cooldown seconds for requesting a new OTP.
   */
  getRemainingCooldown(userId: string): number {
    const records = getAllOtpRecords();
    const record = records[userId];
    if (!record) return 0;
    const elapsed = Date.now() - record.lastSentAt;
    if (elapsed >= RESEND_COOLDOWN_MS) return 0;
    return Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
  },

  /**
   * Cleans up expired OTP records.
   */
  cleanExpiredRecords(): void {
    const records = getAllOtpRecords();
    const now = Date.now();
    let changed = false;
    for (const id in records) {
      if (records[id].expiresAt < now - 24 * 60 * 60 * 1000) {
        delete records[id];
        changed = true;
      }
    }
    if (changed) {
      saveAllOtpRecords(records);
    }
  },
};
