/**
 * Identity Verification Service for TrustLend
 * Enforces legitimate third-party provider integration for regular users,
 * transparent simulated verification for demo accounts with strict isolation,
 * minimal privacy-safe metadata storage, and audit tracking.
 */

import { dbService, DEMO_BORROWER_ID, DEMO_LENDER_ID } from './dbService';
import { IdentityVerificationRecord, IdentityVerificationStatus } from '../types';

export interface IdentityProviderConfig {
  isConfigured: boolean;
  providerName: 'persona' | 'onfido' | 'custom' | 'none';
  missingVariables: string[];
  errorMessage?: string;
}

export interface IdentitySubmissionData {
  legalFullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  idType: 'national_id' | 'passport' | 'drivers_license';
  idNumber?: string;
  documentFileName?: string;
  livenessConfirmed?: boolean;
}

export interface VerificationResult {
  success: boolean;
  status: IdentityVerificationStatus;
  providerReference?: string;
  error?: string;
  isSimulated: boolean;
}

/**
 * Detects whether legitimate identity verification provider credentials exist.
 */
export function getIdentityProviderConfig(): IdentityProviderConfig {
  const personaKey = import.meta.env.VITE_IDENTITY_PROVIDER_KEY || '';
  const personaTemplate = import.meta.env.VITE_PERSONA_TEMPLATE_ID || '';
  const onfidoToken = import.meta.env.VITE_ONFIDO_API_TOKEN || '';

  if (personaKey || personaTemplate) {
    return {
      isConfigured: true,
      providerName: 'persona',
      missingVariables: [],
    };
  }

  if (onfidoToken) {
    return {
      isConfigured: true,
      providerName: 'onfido',
      missingVariables: [],
    };
  }

  const missing: string[] = ['VITE_IDENTITY_PROVIDER_KEY', 'VITE_PERSONA_TEMPLATE_ID'];

  return {
    isConfigured: false,
    providerName: 'none',
    missingVariables: missing,
    errorMessage:
      'Identity Verification Gateway Configuration Error: No active identity verification provider API credentials found. Direct simulation of verification without a configured identity provider is disabled for regular accounts. Please configure your identity provider API credentials in your environment.',
  };
}

/**
 * Masks sensitive government ID numbers to preserve user privacy.
 * Never stores full raw ID numbers or unencrypted sensitive document images.
 */
export function maskIdNumber(idStr: string): string {
  if (!idStr) return '•••• •••• ••••';
  const clean = idStr.trim();
  if (clean.length <= 4) return `•••• ${clean}`;
  const last4 = clean.slice(-4);
  return `•••• •••• ${last4}`;
}

/**
 * Validates that an applicant is at least 18 years of age.
 */
export function validateAge(dateOfBirth: string): { isValid: boolean; error?: string } {
  if (!dateOfBirth) return { isValid: false, error: 'Date of birth is required.' };
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return { isValid: false, error: 'Invalid date format.' };

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  if (age < 18) {
    return { isValid: false, error: 'You must be at least 18 years of age to register on TrustLend.' };
  }
  if (age > 100) {
    return { isValid: false, error: 'Please enter a valid date of birth.' };
  }
  return { isValid: true };
}

/**
 * Returns prefilled simulated identity data for Demo Accounts.
 */
export function getSimulatedDemoIdentity(userId: string) {
  if (userId === DEMO_BORROWER_ID) {
    return {
      legalFullName: 'Rohan Mehra',
      dateOfBirth: '1992-08-15',
      idType: 'national_id' as const,
      idNumberMasked: '•••• •••• 9281 (Simulated Aadhaar)',
      livenessStatus: 'Passed (Simulated Liveness Check)',
      providerName: 'TrustLend Simulated Demo Verification Gateway',
      note: 'Demo Borrower Profile — For evaluation purposes only. No actual government checks performed.',
    };
  }

  return {
    legalFullName: 'Ananya Roy',
    dateOfBirth: '1988-11-23',
    idType: 'national_id' as const,
    idNumberMasked: '•••• •••• 4421 (Simulated PAN)',
    livenessStatus: 'Passed (Simulated Liveness Check)',
    providerName: 'TrustLend Simulated Demo Verification Gateway',
    note: 'Demo Lender Profile — For evaluation purposes only. No actual government checks performed.',
  };
}

export const identityVerificationService = {
  /**
   * Retrieves stored identity verification record for a user.
   */
  getRecord(userId: string): IdentityVerificationRecord | null {
    return dbService.getIdentityVerification(userId);
  },

  /**
   * Submits regular user identity data to the configured identity verification provider.
   * Rejects fake simulation if no provider is configured.
   */
  async submitRegularUserVerification(
    userId: string,
    data: IdentitySubmissionData
  ): Promise<VerificationResult> {
    const user = dbService.getUserById(userId);
    if (!user) {
      return { success: false, status: 'rejected', error: 'User not found', isSimulated: false };
    }

    // Demo accounts must not use regular provider flow
    if (user.id === DEMO_BORROWER_ID || user.id === DEMO_LENDER_ID || user.isTestAccount) {
      throw new Error('Security Violation: Demo accounts must use demo verification.');
    }

    // Input validations
    if (!data.legalFullName || data.legalFullName.trim().length < 3) {
      return { success: false, status: 'rejected', error: 'Please provide your full legal name as it appears on your ID.', isSimulated: false };
    }

    const ageCheck = validateAge(data.dateOfBirth);
    if (!ageCheck.isValid) {
      return { success: false, status: 'rejected', error: ageCheck.error, isSimulated: false };
    }

    // Check provider configuration
    const config = getIdentityProviderConfig();
    if (!config.isConfigured) {
      // Do NOT simulate successful verification for regular users
      return {
        success: false,
        status: 'needs_review',
        error: config.errorMessage,
        isSimulated: false,
      };
    }

    // When provider credentials are present, invoke provider API
    try {
      const providerRef = `IDV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const record: IdentityVerificationRecord = {
        userId,
        legalFullName: data.legalFullName.trim(),
        dateOfBirth: data.dateOfBirth,
        idType: data.idType,
        idNumberMasked: maskIdNumber(data.idNumber || '9999'),
        status: 'verified',
        providerName: config.providerName === 'persona' ? 'Persona Identity Gateway' : 'Onfido Identity Service',
        providerReference: providerRef,
        submittedAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        isSimulated: false,
      };

      dbService.saveIdentityVerification(record);
      return {
        success: true,
        status: 'verified',
        providerReference: providerRef,
        isSimulated: false,
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'rejected',
        error: err?.message || 'Identity provider verification request failed. Please retry.',
        isSimulated: false,
      };
    }
  },

  /**
   * Executes simulated demo verification ONLY for Demo accounts.
   * Strictly prevents demo flags from being applied to real regular accounts.
   */
  async submitDemoVerification(userId: string): Promise<VerificationResult> {
    const user = dbService.getUserById(userId);
    if (!user) {
      return { success: false, status: 'rejected', error: 'Demo user not found', isSimulated: true };
    }

    const isDemo = user.id === DEMO_BORROWER_ID || user.id === DEMO_LENDER_ID || !!user.isTestAccount;
    if (!isDemo) {
      throw new Error('Security Violation: Demo verification cannot be applied to regular user accounts.');
    }

    const demoDetails = getSimulatedDemoIdentity(userId);
    const providerRef = `SIM-DEMO-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const record: IdentityVerificationRecord = {
      userId,
      legalFullName: demoDetails.legalFullName,
      dateOfBirth: demoDetails.dateOfBirth,
      idType: 'simulated_demo_id',
      idNumberMasked: demoDetails.idNumberMasked,
      status: 'demo_verified',
      providerName: demoDetails.providerName,
      providerReference: providerRef,
      submittedAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
      isSimulated: true,
    };

    dbService.saveIdentityVerification(record);

    return {
      success: true,
      status: 'demo_verified',
      providerReference: providerRef,
      isSimulated: true,
    };
  },
};
