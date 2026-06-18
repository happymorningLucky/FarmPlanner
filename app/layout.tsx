import type { Metadata } from 'next'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'

export const metadata: Metadata = {
  title: 'Farm Planner | รับทรัพย์ฟาร์ม',
  description: 'Farm planner and management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
