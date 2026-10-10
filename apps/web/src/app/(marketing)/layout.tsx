import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto min-h-[60vh] max-w-6xl px-4 py-6">{children}</main>
      <Footer />
    </>
  );
}
