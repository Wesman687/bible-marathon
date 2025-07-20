/* === app/layout.tsx === */
import './globals.css'
import { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Logo from '@/assets/logo.svg'
import { AuthProvider } from '@/lib/AuthContext'

export const metadata = {
  title: 'Bible Reading Marathon',
  description: 'Live reader schedule for First Church of God',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full w-full">
      <body className="bg-background text-accent h-full w-full flex flex-col">
        <header className="bg-white shadow px-6 py-4 flex items-center justify-between w-full">
          <Link href="/">
            <Image src={Logo} alt="Church of God" width={350} height={60} />
          </Link>
                <div>
        <h1 className="text-brandBlue font-bold text-4xl">📖 Bible Reading Marathon</h1>
      </div>
          <nav className="text-sm font-semibold space-x-4">
            <Link href="/viewer">
              <button className="px-4 py-2 bg-brandBlue text-white rounded-full shadow-md hover:bg-brandBlue/80 transition-transform duration-200 hover:scale-105">
                View Marathon
              </button>
            </Link>
            <Link href="/stage">
              <button className="px-4 py-2 bg-orange-500 text-white rounded-full shadow-md hover:bg-orange-400 transition-transform duration-200 hover:scale-105">
                Staging Room
              </button>
            </Link>
            <Link href="/auth">
              <button className="px-4 py-2 border border-brandBlue text-brandBlue rounded-full shadow-md hover:bg-brandBlue/10 transition-transform duration-200 hover:scale-105">
                Login / Register
              </button>
            </Link>
          </nav>
        </header>

        {/* Render child page content here */}
        <main className="flex-grow w-full px-6 py-10 bg-gradient-to-br from-white via-blue-50 to-orange-50 flex flex-col items-center justify-start text-center">
          <AuthProvider>{children}</AuthProvider>
        </main>
      </body>
    </html>
  )
}
