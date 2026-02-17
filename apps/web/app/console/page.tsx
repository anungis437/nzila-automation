import { redirect } from 'next/navigation'

/**
 * /console route on the public site redirects to the Console app.
 * In production this will be a separate SWA domain.
 */
export default function ConsolRedirect() {
  const consoleUrl = process.env.NEXT_PUBLIC_CONSOLE_URL || 'http://localhost:3001'
  redirect(consoleUrl)
}
