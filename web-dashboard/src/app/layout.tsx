import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import { LanguageProvider } from '../contexts/LanguageContext'

export const metadata: Metadata = {
  title: 'SPTM - Smart Public Transport Management',
  description: 'Transform your transport operations with intelligent fleet management, real-time tracking, and AI-powered analytics.',
  keywords: 'transport management, fleet management, public transport, bus tracking, driver management',
  authors: [{ name: 'SPTM Team' }],
  openGraph: {
    title: 'SPTM - Smart Public Transport Management',
    description: 'Transform your transport operations with intelligent fleet management.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1e3a8a" />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}