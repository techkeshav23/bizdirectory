import { z } from 'zod';
import { BusinessStatus, ContactEventType, GstinStatus, LocationType } from './enums';

const slugField = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(140)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase, hyphenated slug');

// ---------- Shared primitives ----------
export const phoneSchema = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s()-]/g, ''))
  .pipe(
    z.string().regex(/^(\+?91)?[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  );

export const gstinSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    'Invalid GSTIN format',
  );

export const pincodeSchema = z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid pincode');

// ---------- Auth ----------
export const otpRequestSchema = z.object({
  phone: phoneSchema,
  purpose: z.enum(['login', 'business_verify']).default('login'),
});
export type OtpRequestDto = z.infer<typeof otpRequestSchema>;

export const otpVerifySchema = z.object({
  phone: phoneSchema,
  code: z.string().length(6, 'OTP must be 6 digits'),
});
export type OtpVerifyDto = z.infer<typeof otpVerifySchema>;

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type AdminLoginDto = z.infer<typeof adminLoginSchema>;

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().trim().min(1).max(120).optional(),
});
export type RegisterDto = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, 'Password is required'),
});
export type LoginDto = z.infer<typeof loginSchema>;

// ---------- User ----------
export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  email: z.string().email().optional(),
});
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

// ---------- Business ----------
export const createBusinessSchema = z.object({
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(5000).optional(),
  primaryCategoryId: z.string().uuid(),
  categoryIds: z.array(z.string().uuid()).max(5).optional(),
  locationId: z.string().uuid(),
  address: z.string().trim().max(300).optional(),
  pincode: pincodeSchema.optional(),
  contactPhone: phoneSchema,
  whatsappNumber: phoneSchema.optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  logoUrl: z.string().url().nullish(),
  coverUrl: z.string().url().nullish(),
});
export type CreateBusinessDto = z.infer<typeof createBusinessSchema>;

export const updateBusinessSchema = createBusinessSchema.partial();
export type UpdateBusinessDto = z.infer<typeof updateBusinessSchema>;

export const submitGstinSchema = z.object({ gstin: gstinSchema });
export type SubmitGstinDto = z.infer<typeof submitGstinSchema>;

// ---------- Product ----------
export const createProductSchema = z.object({
  businessId: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(3000).optional(),
  categoryId: z.string().uuid().optional(),
  price: z.number().nonnegative().optional(),
  priceUnit: z.string().trim().max(30).optional(),
  currency: z.string().length(3).default('INR'),
  imageUrls: z.array(z.string().url()).max(8).optional(),
});
export type CreateProductDto = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial().omit({ businessId: true });
export type UpdateProductDto = z.infer<typeof updateProductSchema>;

// ---------- Search ----------
export const searchQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().optional(),
  city: z.string().trim().optional(),
  verified: z.coerce.boolean().optional(),
  sort: z.enum(['relevance', 'rating', 'recent']).default('relevance'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type SearchQueryDto = z.infer<typeof searchQuerySchema>;

// ---------- Contact ----------
export const contactEventSchema = z.object({
  businessId: z.string().uuid(),
  type: ContactEventType,
  source: z.string().trim().max(40).optional(),
  productId: z.string().uuid().optional(),
});
export type ContactEventDto = z.infer<typeof contactEventSchema>;

// ---------- Review ----------
export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().max(2000).optional(),
});
export type CreateReviewDto = z.infer<typeof createReviewSchema>;

// ---------- Admin ----------
export const moderateBusinessSchema = z.object({
  status: BusinessStatus,
  reason: z.string().trim().max(500).optional(),
});
export type ModerateBusinessDto = z.infer<typeof moderateBusinessSchema>;

export const gstinOverrideSchema = z.object({
  status: GstinStatus,
  legalName: z.string().trim().max(200).optional(),
});
export type GstinOverrideDto = z.infer<typeof gstinOverrideSchema>;

export const categoryUpsertSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: slugField,
  parentId: z.string().uuid().nullish(),
  iconUrl: z.string().url().nullish(),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(true),
});
export type CategoryUpsertDto = z.infer<typeof categoryUpsertSchema>;

export const locationUpsertSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: slugField,
  type: LocationType,
  parentId: z.string().uuid().nullish(),
  pincode: pincodeSchema.nullish(),
});
export type LocationUpsertDto = z.infer<typeof locationUpsertSchema>;

export const updateUserRoleSchema = z.object({
  role: z.enum(['customer', 'business_owner', 'admin']).optional(),
  status: z.enum(['active', 'blocked']).optional(),
});
export type UpdateUserRoleDto = z.infer<typeof updateUserRoleSchema>;

export const planUpsertSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: slugField.max(80),
  price: z.coerce.number().nonnegative().max(1_000_000).default(0),
  interval: z.enum(['monthly', 'yearly']).default('yearly'),
  features: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(true),
});
export type PlanUpsertDto = z.infer<typeof planUpsertSchema>;

export const promotionSchema = z.object({
  isFeatured: z.boolean().optional(),
  isSponsored: z.boolean().optional(),
});
export type PromotionDto = z.infer<typeof promotionSchema>;

export const settingsUpdateSchema = z.object({
  settings: z.record(z.string().max(80), z.string().max(4000).nullable()),
});
export type SettingsUpdateDto = z.infer<typeof settingsUpdateSchema>;

// ---------- Subscriptions / Payments ----------
export const checkoutSchema = z.object({
  businessId: z.string().uuid(),
  planSlug: z.string().trim().min(1),
});
export type CheckoutDto = z.infer<typeof checkoutSchema>;

export const verifyPaymentSchema = z.object({
  businessId: z.string().uuid(),
  planSlug: z.string().trim().min(1),
  razorpayOrderId: z.string().trim().min(1),
  razorpayPaymentId: z.string().trim().min(1),
  razorpaySignature: z.string().trim().min(1),
});
export type VerifyPaymentDto = z.infer<typeof verifyPaymentSchema>;

// ---------- Revalidation contract (api -> web) ----------
export const revalidatePayloadSchema = z.object({
  tags: z.array(z.string()).min(1),
  paths: z.array(z.string()).optional(),
});
export type RevalidatePayload = z.infer<typeof revalidatePayloadSchema>;
