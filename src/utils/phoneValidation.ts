/**
 * Phone Number Validation and Region Formatting Utilities for TrustLend
 */

export interface CountryRegion {
  code: string;
  name: string;
  dialCode: string;
  placeholder: string;
  flag: string;
  patternDesc: string;
  validate: (digits: string) => boolean;
}

export const SUPPORTED_REGIONS: CountryRegion[] = [
  {
    code: 'IN',
    name: 'India',
    dialCode: '+91',
    placeholder: '98765 43210',
    flag: '🇮🇳',
    patternDesc: '10 digits starting with 6, 7, 8, or 9',
    validate: (digits: string) => /^[6-9]\d{9}$/.test(digits),
  },
  {
    code: 'US',
    name: 'United States',
    dialCode: '+1',
    placeholder: '(555) 012-3456',
    flag: '🇺🇸',
    patternDesc: '10 digits starting with 2-9',
    validate: (digits: string) => /^[2-9]\d{9}$/.test(digits),
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    dialCode: '+44',
    placeholder: '7911 123456',
    flag: '🇬🇧',
    patternDesc: '10-11 digits starting with 7',
    validate: (digits: string) => /^7\d{9,10}$/.test(digits),
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    dialCode: '+971',
    placeholder: '50 123 4567',
    flag: '🇦🇪',
    patternDesc: '9 digits starting with 5',
    validate: (digits: string) => /^5\d{8}$/.test(digits),
  },
  {
    code: 'SG',
    name: 'Singapore',
    dialCode: '+65',
    placeholder: '8123 4567',
    flag: '🇸🇬',
    patternDesc: '8 digits starting with 8 or 9',
    validate: (digits: string) => /^[89]\d{7}$/.test(digits),
  },
  {
    code: 'AU',
    name: 'Australia',
    dialCode: '+61',
    placeholder: '412 345 678',
    flag: '🇦🇺',
    patternDesc: '9 digits starting with 4',
    validate: (digits: string) => /^4\d{8}$/.test(digits),
  },
  {
    code: 'DE',
    name: 'Germany',
    dialCode: '+49',
    placeholder: '151 12345678',
    flag: '🇩🇪',
    patternDesc: '10-11 digits starting with 15, 16, or 17',
    validate: (digits: string) => /^1[567]\d{8,9}$/.test(digits),
  },
  {
    code: 'CA',
    name: 'Canada',
    dialCode: '+1',
    placeholder: '(416) 555-0199',
    flag: '🇨🇦',
    patternDesc: '10 digits',
    validate: (digits: string) => /^[2-9]\d{9}$/.test(digits),
  },
];

export function getRegionByCode(code: string): CountryRegion {
  return SUPPORTED_REGIONS.find((r) => r.code === code) || SUPPORTED_REGIONS[0];
}

export function extractDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function validatePhoneNumber(regionCode: string, rawNumber: string): { isValid: boolean; error?: string } {
  const region = getRegionByCode(regionCode);
  const digits = extractDigits(rawNumber);

  if (!digits) {
    return { isValid: false, error: 'Phone number is required.' };
  }

  if (!region.validate(digits)) {
    return {
      isValid: false,
      error: `Invalid phone number for ${region.name}. Must be ${region.patternDesc}.`,
    };
  }

  return { isValid: true };
}

export function normalizePhoneNumber(dialCode: string, rawNumber: string): string {
  const digits = extractDigits(rawNumber);
  const cleanedDialCode = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  return `${cleanedDialCode}${digits}`;
}

export function formatPhoneDisplay(dialCode: string, rawNumber: string): string {
  const digits = extractDigits(rawNumber);
  if (!digits) return dialCode;
  return `${dialCode} ${digits}`;
}
