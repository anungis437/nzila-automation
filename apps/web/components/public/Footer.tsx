import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-white mb-4">Nzila Ventures</h3>
            <p className="text-gray-400 mb-4">
              Venture studio and ethical IP-holding company advancing human-centered 
              solutions across 10 verticals.
            </p>
            <p className="text-sm text-gray-500">
              Building intentional, equitable technology for care, cognition, learning, and equity.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
              <li><Link href="/portfolio" className="hover:text-white transition">Portfolio</Link></li>
              <li><Link href="/verticals" className="hover:text-white transition">Verticals</Link></li>
              <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/dashboard" className="hover:text-white transition">Team Portal</Link></li>
              <li><a href="https://github.com/anungis437/nzila-automation" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Documentation</a></li>
              <li><Link href="#" className="hover:text-white transition">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-white transition">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Nzila Ventures. All rights reserved.</p>
          <p className="mt-2">Built with intentionality, ethics, and impact.</p>
        </div>
      </div>
    </footer>
  );
}
