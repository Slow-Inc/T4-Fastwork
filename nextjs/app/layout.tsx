import type { Metadata } from 'next';
import {
  Space_Grotesk,
  Inter,
  JetBrains_Mono,
  IBM_Plex_Sans_Thai,
} from 'next/font/google';
import './globals.css';
import { Analytics } from '@/components/site/analytics';
import { TurnstileScript } from '@/components/site/turnstile-script';
import { AiGreetingPopup } from '@/components/site/ai-greeting-popup';
import { LocaleProvider } from '@/i18n/locale-context';
import { pageAlternates } from '@/lib/seo';

const disp = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-disp',
});
const body = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-body',
});
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});
const thai = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-thai',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://t4labs.co';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'T4 Labs — Product Engineering Partner',
    template: '%s',
  },
  description:
    'พาร์ตเนอร์ด้านวิศวกรรมซอฟต์แวร์สำหรับ Founder และองค์กร — SaaS, Web App และ AI Product ที่สเกลได้',
  keywords: ['รับทำเว็บไซต์', 'SaaS', 'Web Application', 'AI Product', 'RAG', 'T4 Labs'],
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    siteName: 'T4 Labs',
    url: SITE_URL,
  },
  alternates: pageAlternates('/'),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="th"
      className={`${disp.variable} ${body.variable} ${mono.variable} ${thai.variable}`}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'T4 Labs',
                url: SITE_URL,
                description:
                  'Product engineering partner — SaaS, Web Application และ AI Product',
              },
              {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'T4 Labs',
                url: SITE_URL,
              },
            ]),
          }}
        />
        <LocaleProvider>{children}</LocaleProvider>
        <AiGreetingPopup />
        <Analytics />
        <TurnstileScript />
      </body>
    </html>
  );
}
