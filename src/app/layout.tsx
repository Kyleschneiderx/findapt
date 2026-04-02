import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'FindaPelvicPT — Find Pelvic Floor Physical Therapists Near You',
    template: '%s | FindaPelvicPT',
  },
  description:
    'Find specialized pelvic floor physical therapists in your area. Browse by city, specialty, or provider name. Trusted directory of qualified pelvic health professionals.',
  keywords: [
    'pelvic floor physical therapy',
    'pelvic floor therapist',
    'pelvic health',
    'physical therapy near me',
    'pelvic pain treatment',
    'postpartum physical therapy',
    'prenatal physical therapy',
    'urinary incontinence therapy',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'FindaPelvicPT',
    title: 'FindaPelvicPT — Find Pelvic Floor Physical Therapists Near You',
    description:
      'Find specialized pelvic floor physical therapists in your area. Browse by city, specialty, or provider name.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FindaPelvicPT — Find Pelvic Floor Physical Therapists Near You',
    description:
      'Find specialized pelvic floor physical therapists in your area.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navigation />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
