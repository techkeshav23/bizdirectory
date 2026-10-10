export * from './enums';
export * from './schemas';

// Cache tag helpers — identical names MUST be used on api (caller) and web (revalidator).
export const tagBusiness = (id: string) => `business:${id}`;
export const tagProduct = (id: string) => `product:${id}`;
export const tagCity = (slug: string) => `city:${slug}`;
export const tagCategory = (slug: string) => `category:${slug}`;
