/**
 * Validates a GSTIN's format and checksum (last char).
 * GSTIN = 2-digit state + 10-char PAN + entity digit + 'Z' + checksum char.
 */
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const CODES = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function isValidGstinFormat(gstin: string): boolean {
  return GSTIN_REGEX.test(gstin);
}

export function isValidGstinChecksum(gstin: string): boolean {
  if (gstin.length !== 15) return false;
  const factor = [1, 2];
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const code = CODES.indexOf(gstin[i]!);
    if (code < 0) return false;
    const product = code * factor[i % 2]!;
    sum += Math.floor(product / 36) + (product % 36);
  }
  const checkCode = (36 - (sum % 36)) % 36;
  return CODES[checkCode] === gstin[14];
}

export function isValidGstin(gstin: string): boolean {
  const g = gstin.toUpperCase().trim();
  return isValidGstinFormat(g) && isValidGstinChecksum(g);
}
