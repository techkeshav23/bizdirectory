import { createHash, randomBytes, randomInt } from 'node:crypto';

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function hashIp(ip: string | undefined): string | null {
  if (!ip) return null;
  return sha256(`ip:${ip}`).slice(0, 64);
}

export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function randomToken(bytes = 48): string {
  return randomBytes(bytes).toString('base64url');
}

export function shortId(len = 8): string {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
  let out = '';
  const buf = randomBytes(len);
  for (let i = 0; i < len; i++) {
    out += alphabet[buf[i]! % alphabet.length];
  }
  return out;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}

/** Masks a phone for logs: +919876543210 -> +91XXXXXX3210 */
export function maskPhone(phone: string): string {
  if (phone.length < 4) return 'XXXX';
  return phone.slice(0, 3) + 'XXXXXX' + phone.slice(-4);
}

/** Normalises an Indian mobile to E.164 (+91XXXXXXXXXX). */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  const ten = digits.slice(-10);
  return `+91${ten}`;
}
