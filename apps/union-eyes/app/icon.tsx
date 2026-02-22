export default function Icon() {
  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#7c3aed"/>
      <text x="50" y="70" font-family="Arial, sans-serif" font-size="60" font-weight="bold" text-anchor="middle" fill="white">U</text>
    </svg>`,
    {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
  )
}

