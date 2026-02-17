import Link from 'next/link'
import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs'

/**
 * Public landing page — unauthenticated users see a CTA;
 * authenticated users are redirected to /console.
 */
export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="text-center max-w-lg px-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Nzila Console
          </span>
        </h1>
        <p className="text-gray-600 mb-8">
          Internal operations dashboard for the Nzila Ventures portfolio.
        </p>

        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
              Sign In to Continue
            </button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          <Link
            href="/console"
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition inline-block"
          >
            Go to Console
          </Link>
        </SignedIn>
      </div>
    </main>
  )
}
