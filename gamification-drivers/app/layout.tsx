import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { metadata } from './metadata';
import Script from 'next/script';
import { Toaster } from './components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export { metadata };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"
          strategy="afterInteractive"
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <main className="pb-20">
            {children}
          </main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}