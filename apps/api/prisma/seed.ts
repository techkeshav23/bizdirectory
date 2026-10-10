import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const CATEGORIES = [
  { name: 'Steel & Metal Suppliers', slug: 'steel-metal-suppliers' },
  { name: 'Building Materials', slug: 'building-materials' },
  { name: 'Industrial Machinery', slug: 'industrial-machinery' },
  { name: 'Electronics & Electricals', slug: 'electronics-electricals' },
  { name: 'Packaging', slug: 'packaging' },
  { name: 'Textiles & Fabrics', slug: 'textiles-fabrics' },
  { name: 'Chemicals', slug: 'chemicals' },
  { name: 'Agriculture & Food', slug: 'agriculture-food' },
  { name: 'Furniture & Interiors', slug: 'furniture-interiors' },
  { name: 'Printing & Stationery', slug: 'printing-stationery' },
];

const STATES = [
  {
    name: 'Maharashtra',
    slug: 'maharashtra',
    cities: [
      { name: 'Mumbai', slug: 'mumbai' },
      { name: 'Pune', slug: 'pune' },
      { name: 'Nagpur', slug: 'nagpur' },
    ],
  },
  {
    name: 'Delhi',
    slug: 'delhi',
    cities: [{ name: 'New Delhi', slug: 'new-delhi' }],
  },
  {
    name: 'Karnataka',
    slug: 'karnataka',
    cities: [
      { name: 'Bengaluru', slug: 'bengaluru' },
      { name: 'Mysuru', slug: 'mysuru' },
    ],
  },
  {
    name: 'Gujarat',
    slug: 'gujarat',
    cities: [
      { name: 'Ahmedabad', slug: 'ahmedabad' },
      { name: 'Surat', slug: 'surat' },
    ],
  },
];

const PLANS = [
  { name: 'Free', slug: 'free', price: 0, interval: 'monthly', sortOrder: 0, features: ['Basic listing', '1 category'] },
  { name: 'Silver', slug: 'silver', price: 499, interval: 'monthly', sortOrder: 1, features: ['Verified badge', '3 categories', 'Lead analytics'] },
  { name: 'Gold', slug: 'gold', price: 1499, interval: 'monthly', sortOrder: 2, features: ['Featured listing', '5 categories', 'Priority support', 'Sponsored slots'] },
];

async function main() {
  console.log('Seeding categories...');
  for (const [i, c] of CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, sortOrder: i },
      create: { name: c.name, slug: c.slug, sortOrder: i },
    });
  }

  console.log('Seeding locations...');
  for (const state of STATES) {
    const st = await prisma.location.upsert({
      where: { type_slug_parentId: { type: 'state', slug: state.slug, parentId: null as any } },
      update: { name: state.name },
      create: { type: 'state', name: state.name, slug: state.slug },
    });
    for (const city of state.cities) {
      await prisma.location.upsert({
        where: { type_slug_parentId: { type: 'city', slug: city.slug, parentId: st.id } },
        update: { name: city.name },
        create: { type: 'city', name: city.name, slug: city.slug, parentId: st.id },
      });
    }
  }

  console.log('Seeding subscription plans...');
  for (const p of PLANS) {
    await prisma.subscriptionPlan.upsert({
      where: { slug: p.slug },
      update: { name: p.name, price: p.price, interval: p.interval, sortOrder: p.sortOrder, features: p.features },
      create: { name: p.name, slug: p.slug, price: p.price, interval: p.interval, sortOrder: p.sortOrder, features: p.features },
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@bizdir.local';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'ChangeMe!123';
  const adminPhone = '+919999900000';
  console.log(`Seeding admin user (${adminEmail})...`);
  const adminUser = await prisma.user.upsert({
    where: { phone: adminPhone },
    update: { role: 'admin' },
    create: { phone: adminPhone, role: 'admin', fullName: 'Platform Admin', isPhoneVerified: true },
  });
  await prisma.adminCredential.upsert({
    where: { userId: adminUser.id },
    update: { email: adminEmail, passwordHash: await argon2.hash(adminPassword) },
    create: { userId: adminUser.id, email: adminEmail, passwordHash: await argon2.hash(adminPassword) },
  });

  await seedDemo();

  console.log('Seed complete.');
}

interface DemoTemplate {
  name: string;
  categorySlug: string;
  citySlug: string;
  description: string;
  tier?: 'silver' | 'gold';
  verified?: boolean;
  rating?: number;
  products: { name: string; price: number; unit: string }[];
}

const DEMO: DemoTemplate[] = [
  {
    name: 'Shree Balaji Steels',
    categorySlug: 'steel-metal-suppliers',
    citySlug: 'pune',
    description: 'Leading supplier of TMT bars, MS angles and structural steel in Pune since 2008.',
    tier: 'gold',
    verified: true,
    rating: 4.6,
    products: [
      { name: 'TMT Bar 12mm Fe500D', price: 62, unit: 'kg' },
      { name: 'MS Angle 50x50x5', price: 58, unit: 'kg' },
      { name: 'MS Square Pipe', price: 65, unit: 'kg' },
    ],
  },
  {
    name: 'Mahalaxmi Cement & Blocks',
    categorySlug: 'building-materials',
    citySlug: 'pune',
    description: 'Wholesale cement, AAC blocks, fly ash bricks and construction aggregates.',
    tier: 'silver',
    verified: true,
    rating: 4.3,
    products: [
      { name: 'OPC 53 Grade Cement', price: 390, unit: 'bag' },
      { name: 'AAC Block 600x200x100', price: 42, unit: 'piece' },
    ],
  },
  {
    name: 'Deccan Industrial Machines',
    categorySlug: 'industrial-machinery',
    citySlug: 'pune',
    description: 'CNC lathes, lathe machines and workshop equipment with on-site installation.',
    verified: true,
    rating: 4.1,
    products: [
      { name: 'CNC Lathe Machine', price: 850000, unit: 'unit' },
      { name: 'Bench Drill Press', price: 18500, unit: 'unit' },
    ],
  },
  {
    name: 'Mumbai Packaging Hub',
    categorySlug: 'packaging',
    citySlug: 'mumbai',
    description: 'Corrugated boxes, bubble wrap and custom printed packaging for ecommerce sellers.',
    tier: 'gold',
    verified: true,
    rating: 4.7,
    products: [
      { name: '3-Ply Corrugated Box (M)', price: 14, unit: 'piece' },
      { name: 'Bubble Wrap Roll 1m', price: 480, unit: 'roll' },
      { name: 'Packing Tape 2 inch', price: 32, unit: 'piece' },
    ],
  },
  {
    name: 'Zenith Electricals',
    categorySlug: 'electronics-electricals',
    citySlug: 'mumbai',
    description: 'Switchgear, cables, LED lighting and industrial electrical supplies.',
    verified: true,
    rating: 4.2,
    products: [
      { name: 'MCB 32A Double Pole', price: 420, unit: 'piece' },
      { name: 'PVC Cable 2.5sqmm', price: 1850, unit: 'coil' },
    ],
  },
  {
    name: 'Surat Textile Traders',
    categorySlug: 'textiles-fabrics',
    citySlug: 'surat',
    description: 'Wholesale saree fabric, polyester and cotton rolls at mill-direct prices.',
    tier: 'silver',
    verified: true,
    rating: 4.4,
    products: [
      { name: 'Polyester Fabric Roll', price: 95, unit: 'metre' },
      { name: 'Cotton Cambric Roll', price: 120, unit: 'metre' },
    ],
  },
  {
    name: 'Gujarat Chem Solutions',
    categorySlug: 'chemicals',
    citySlug: 'ahmedabad',
    description: 'Industrial solvents, acids and water-treatment chemicals — bulk supply.',
    verified: true,
    rating: 3.9,
    products: [
      { name: 'Caustic Soda Flakes', price: 68, unit: 'kg' },
      { name: 'Hydrochloric Acid 30%', price: 22, unit: 'litre' },
    ],
  },
  {
    name: 'Namma Agri Exports',
    categorySlug: 'agriculture-food',
    citySlug: 'bengaluru',
    description: 'Exporters of spices, pulses and dehydrated vegetables. FSSAI certified.',
    tier: 'gold',
    verified: true,
    rating: 4.8,
    products: [
      { name: 'Turmeric Powder (bulk)', price: 180, unit: 'kg' },
      { name: 'Toor Dal', price: 135, unit: 'kg' },
      { name: 'Dried Red Chilli', price: 240, unit: 'kg' },
    ],
  },
  {
    name: 'Bengaluru Furniture Works',
    categorySlug: 'furniture-interiors',
    citySlug: 'bengaluru',
    description: 'Office furniture, modular workstations and custom interiors for corporates.',
    verified: false,
    rating: 4.0,
    products: [
      { name: 'Ergonomic Office Chair', price: 6500, unit: 'piece' },
      { name: 'Modular Workstation (4-seat)', price: 48000, unit: 'set' },
    ],
  },
  {
    name: 'Capital Print House',
    categorySlug: 'printing-stationery',
    citySlug: 'new-delhi',
    description: 'Offset and digital printing — brochures, visiting cards, bulk stationery.',
    tier: 'silver',
    verified: true,
    rating: 4.5,
    products: [
      { name: 'Visiting Cards (1000)', price: 450, unit: 'pack' },
      { name: 'A4 Brochure Printing', price: 8, unit: 'piece' },
    ],
  },
  {
    name: 'Nagpur Steel Depot',
    categorySlug: 'steel-metal-suppliers',
    citySlug: 'nagpur',
    description: 'Retail and wholesale steel, GI sheets and roofing materials.',
    verified: false,
    rating: 3.8,
    products: [{ name: 'GI Sheet 24 Gauge', price: 78, unit: 'kg' }],
  },
  {
    name: 'Delhi Hardware & Tools',
    categorySlug: 'building-materials',
    citySlug: 'new-delhi',
    description: 'Power tools, hand tools, fasteners and construction hardware.',
    verified: true,
    rating: 4.2,
    products: [
      { name: 'Cordless Drill 18V', price: 3800, unit: 'unit' },
      { name: 'Anchor Fasteners (box)', price: 320, unit: 'box' },
    ],
  },
];

async function seedDemo(): Promise<void> {
  console.log('Seeding demo businesses...');
  const cats = await prisma.category.findMany();
  const cities = await prisma.location.findMany({ where: { type: 'city' } });
  const catBySlug = new Map(cats.map((c) => [c.slug, c]));
  const cityBySlug = new Map(cities.map((c) => [c.slug, c]));

  // Demo owners (round-robin) + a demo reviewer.
  const owners = [];
  for (let i = 0; i < 4; i++) {
    const phone = `+91988770000${i}`;
    owners.push(
      await prisma.user.upsert({
        where: { phone },
        update: { role: 'business_owner' },
        create: {
          phone,
          role: 'business_owner',
          fullName: `Demo Owner ${i + 1}`,
          isPhoneVerified: true,
        },
      }),
    );
  }
  const reviewer = await prisma.user.upsert({
    where: { phone: '+919877711111' },
    update: {},
    create: { phone: '+919877711111', fullName: 'Rahul Kumar', isPhoneVerified: true },
  });

  for (let i = 0; i < DEMO.length; i++) {
    const t = DEMO[i]!;
    const cat = catBySlug.get(t.categorySlug);
    const city = cityBySlug.get(t.citySlug);
    if (!cat || !city) continue;

    const publicId = `demo${String(i + 1).padStart(4, '0')}`;
    const slug = `${slugify(t.name)}-${slugify(city.name)}-${publicId.slice(-4)}`;

    const existing = await prisma.business.findUnique({ where: { publicId } });
    if (existing) continue;

    const owner = owners[i % owners.length]!;
    const phone = `+9190000${String(1000 + i)}`;
    const rating = t.rating ?? 0;

    const business = await prisma.business.create({
      data: {
        ownerId: owner.id,
        name: t.name,
        slug,
        publicId,
        description: t.description,
        primaryCategoryId: cat.id,
        locationId: city.id,
        address: `${city.name}, India`,
        contactPhone: phone,
        whatsappNumber: phone,
        logoUrl: `https://picsum.photos/seed/${publicId}-logo/160/160`,
        coverUrl: `https://picsum.photos/seed/${publicId}-cover/1200/400`,
        gstin: t.verified ? '27AAAAA0000A1Z5' : null,
        gstinStatus: t.verified ? 'verified' : 'none',
        gstinVerifiedAt: t.verified ? new Date() : null,
        legalName: t.verified ? `${t.name} Pvt Ltd` : null,
        status: 'active',
        subscriptionTier: t.tier ?? 'free',
        isFeatured: t.tier === 'gold',
        isSponsored: t.tier === 'gold',
        ratingAvg: rating,
        ratingCount: rating > 0 ? 3 + (i % 5) : 0,
        categories: { create: [{ categoryId: cat.id }] },
        products: {
          create: t.products.map((p, j) => ({
            name: p.name,
            slug: `${slugify(p.name)}-${publicId.slice(-4)}${j}`,
            publicId: `${publicId}p${j}`,
            price: p.price,
            priceUnit: p.unit,
            currency: 'INR',
            images: {
              create: [
                {
                  url: `https://picsum.photos/seed/${publicId}-${j}/400/300`,
                  sortOrder: 0,
                  isPrimary: true,
                },
              ],
            },
          })),
        },
      },
    });

    if (rating > 0) {
      await prisma.review.upsert({
        where: { businessId_userId: { businessId: business.id, userId: reviewer.id } },
        update: {},
        create: {
          businessId: business.id,
          userId: reviewer.id,
          rating: Math.round(rating),
          body: 'Great quality and quick response. Recommended supplier.',
          status: 'approved',
        },
      });
    }
  }
  console.log(`Seeded ${DEMO.length} demo businesses with products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
