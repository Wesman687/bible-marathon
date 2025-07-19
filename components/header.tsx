import Image from 'next/image'
import Link from 'next/link'
import Logo from '@/assets/logo.svg'

export default function Header() {
  return (
    <header className="bg-white shadow-md px-6 py-3 flex items-center justify-between">
      <Link href="/">
        <Image src={Logo} alt="Church of God" width={180} height={40} />
      </Link>
      <nav>
        <Link href="/marathon/viewer" className="text-primary font-semibold mr-4">
          View Marathon
        </Link>
        <Link href="/marathon/stage" className="text-secondary font-semibold">
          Stage Login
        </Link>
      </nav>
    </header>
  );
}