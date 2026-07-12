import type { Metadata } from 'next';
import {
  Space_Grotesk,
  Inter,
  JetBrains_Mono,
  IBM_Plex_Sans_Thai,
} from 'next/font/google';
import './globals.css';

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

export const metadata: Metadata = {
  title: 'T4 Labs — Product Engineering Partner',
  description:
    'พาร์ตเนอร์ด้านวิศวกรรมซอฟต์แวร์สำหรับ Founder และองค์กร — SaaS, Web App และ AI Product ที่สเกลได้',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="th"
      className={`${disp.variable} ${body.variable} ${mono.variable} ${thai.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
