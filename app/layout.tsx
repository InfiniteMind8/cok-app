import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Fraunces, Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { IOSInstallPrompt } from '@/components/shared/ios-install-prompt'
import './globals.css'

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant-garamond',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'City of Karis',
  description: 'Beautiful, Empowered Living in Guyana',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'City of Karis',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1E2E23',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${cormorantGaramond.variable} ${fraunces.variable} ${inter.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <head>
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <link rel="apple-touch-icon" href="/logo.png" />
        </head>
        <body className="min-h-full flex flex-col bg-karis-stone-50 font-body" suppressHydrationWarning>
          {children}
          <IOSInstallPrompt />
        </body>
      </html>
    </ClerkProvider>
  )
}
