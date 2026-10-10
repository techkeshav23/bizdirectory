export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function waLink(number: string, text: string, countryCode = '91'): string {
  const digits = number.replace(/\D/g, '').slice(-10);
  return `https://wa.me/${countryCode}${digits}?text=${encodeURIComponent(text)}`;
}

export function telLink(number: string): string {
  return `tel:${number.startsWith('+') ? number : '+91' + number.replace(/\D/g, '').slice(-10)}`;
}

export function inr(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const n = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}
