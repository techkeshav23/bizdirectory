import Link from 'next/link';
import { apiGet } from '@/lib/api';
import type { CategoryDto, LocationDto } from '@/lib/types';

export async function Footer() {
  const [categories, cities] = await Promise.all([
    apiGet<CategoryDto[]>('/categories', { revalidate: 3600, tags: ['categories'] }).catch(() => []),
    apiGet<LocationDto[]>('/locations?type=city', { revalidate: 86400, tags: ['cities'] }).catch(
      () => [],
    ),
  ]);

  return (
    <footer className="mt-24 border-t border-border bg-forest text-[#d7e0d7]">
      <div className="mx-auto max-w-[1200px] px-4 py-14">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2 md:col-span-1">
            <div className="font-display text-2xl font-extrabold tracking-tight text-white">
              Biz<span className="text-[#9bc4a0]">Directory</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#b9cbc3]">
              India&apos;s direct customer-to-business discovery platform. Find verified suppliers
              and reach them without middlemen.
            </p>
          </div>
          <FooterCol title="Top Categories">
            {categories.slice(0, 6).map((c) => (
              <FooterLink key={c.id} href={`/category/${c.slug}`}>
                {c.name}
              </FooterLink>
            ))}
          </FooterCol>
          <FooterCol title="Top Cities">
            {cities.slice(0, 6).map((c) => (
              <FooterLink key={c.id} href={`/location/${c.slug}`}>
                {c.name}
              </FooterLink>
            ))}
          </FooterCol>
          <FooterCol title="Company">
            <FooterLink href="/register">List your business</FooterLink>
            <FooterLink href="/pricing">Pricing</FooterLink>
            <FooterLink href="/about">About</FooterLink>
            <FooterLink href="/privacy">Privacy</FooterLink>
            <FooterLink href="/terms">Terms</FooterLink>
          </FooterCol>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-[#9fb4ab]">
        © {new Date().getFullYear()} BizDirectory · Made in India 🇮🇳
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-400">
        {title}
      </h4>
      <ul className="space-y-2.5 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-[#cdd9d2] transition-colors hover:text-paper">
        {children}
      </Link>
    </li>
  );
}
