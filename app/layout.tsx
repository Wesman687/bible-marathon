/* === app/layout.tsx === */
import './globals.css'
import { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Logo from '@/assets/logo.svg'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import { AuthNav } from '@/components/AuthNav'

export const metadata = {
  title: 'Bible Reading Marathon',
  description: 'Live reader schedule for First Church of God',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full w-full">
      <body className="bg-background text-accent h-full w-full flex flex-col">
        <AuthProvider>
        <header className="bg-white shadow px-6 py-4 flex items-center justify-between w-full">
          <Link href="/">
            <Image src={Logo} alt="Church of God" width={350} height={60} />
          </Link>
                <div>
        <h1 className="text-brandBlue font-bold text-4xl">📖 Bible Reading Marathon</h1>
      </div>
          <nav className="text-sm font-semibold space-x-4 flex items-center">

            <AuthNav />
          </nav>
        </header>

        {/* Render child page content here */}
        <main className="flex-grow w-full px-6 py-10 bg-gradient-to-br from-white via-blue-50 to-orange-50 flex flex-col items-center justify-start text-center">
          {children}
        </main>
      </AuthProvider>
      </body>
    </html>
  )
}
