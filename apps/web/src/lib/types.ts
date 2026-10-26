// Response shapes returned by the API (subset used by the web app).
export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  parentId: string | null;
}

export interface LocationDto {
  id: string;
  name: string;
  slug: string;
  type: 'state' | 'city' | 'area';
  parentId: string | null;
  pincode: string | null;
}

export interface BusinessCardDto {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  ratingAvg: string | number;
  ratingCount: number;
  gstinStatus: string;
  isFeatured: boolean;
  isSponsored?: boolean;
  primaryCategory: { name: string; slug: string };
  location: { name: string; slug: string };
}

export interface SearchResponse {
  items: BusinessCardDto[];
  nextCursor: string | null;
  total?: number;
}

export interface ProductDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string | number | null;
  priceUnit: string | null;
  currency: string;
  images: { url: string; alt: string | null }[];
}

export interface BusinessDetailDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  contactPhone: string;
  whatsappNumber: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  gstinStatus: string;
  legalName: string | null;
  ratingAvg: string | number;
  ratingCount: number;
  primaryCategory: { name: string; slug: string };
  location: { name: string; slug: string };
  categories: { category: { name: string; slug: string } }[];
  images: { url: string; alt: string | null }[];
  products: ProductDto[];
  reviews: { id: string; rating: number; body: string | null; user: { fullName: string | null } }[];
  redirectTo?: string;
}
