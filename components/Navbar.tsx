import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-solana-dark/80 backdrop-blur-lg border-b border-solana-purple/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/SIMDigest.png"
              alt="SIMD Tracker"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-xl font-bold text-white">SIMD Tracker</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/app" className="text-gray-300 hover:text-white transition-colors">
              App
            </Link>
            <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
              About
            </Link>
            <Link
              href="#subscribe"
              className="px-4 py-2 bg-gradient-solana rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
            >
              Subscribe
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
