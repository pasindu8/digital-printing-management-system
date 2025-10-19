// File path: src/app/layout.js

import './globals.css';

export const metadata = {
  title: 'First Promovier - Professional Print Shop Services',
  description: 'First Promovier offers comprehensive printing services including business cards, banners, flyers, posters, and custom printing solutions. Fast, reliable, and professional printing services.',
  keywords: 'printing services, business cards, banners, flyers, posters, custom printing, print shop, Sri Lanka',
  authors: [{ name: 'First Promovier' }],
  openGraph: {
    title: 'First Promovier - Professional Print Shop Services',
    description: 'Professional printing services for all your business needs',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-inter antialiased">{children}</body>
    </html>
  );
}