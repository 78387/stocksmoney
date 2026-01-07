import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { LocationProvider } from '@/hooks/useLocation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StocksMoney - Digital Products Platform',
  description: 'Buy and sell digital products with secure wallet system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LocationProvider>
          {children}
          <Toaster position="top-right" />
        </LocationProvider>
      </body>
    </html>
  )
}
