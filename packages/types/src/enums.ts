import { z } from 'zod';

export const UserRole = z.enum(['customer', 'business_owner', 'admin']);
export type UserRole = z.infer<typeof UserRole>;

export const UserStatus = z.enum(['active', 'blocked']);
export type UserStatus = z.infer<typeof UserStatus>;

export const OtpPurpose = z.enum(['login', 'business_verify']);
export type OtpPurpose = z.infer<typeof OtpPurpose>;

export const BusinessStatus = z.enum([
  'draft',
  'pending_review',
  'active',
  'suspended',
  'rejected',
]);
export type BusinessStatus = z.infer<typeof BusinessStatus>;

export const GstinStatus = z.enum(['none', 'pending', 'verified', 'failed', 'manual']);
export type GstinStatus = z.infer<typeof GstinStatus>;

export const ReviewStatus = z.enum(['pending', 'approved', 'rejected']);
export type ReviewStatus = z.infer<typeof ReviewStatus>;

export const ContactEventType = z.enum([
  'call',
  'whatsapp',
  'view_phone',
  'view_profile',
  'website',
]);
export type ContactEventType = z.infer<typeof ContactEventType>;

export const LocationType = z.enum(['state', 'city', 'area']);
export type LocationType = z.infer<typeof LocationType>;
