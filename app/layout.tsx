import './globals.css'

export const metadata = {
  title: 'the-hunt',
  description: 'Candidate profile building and opportunity tracking',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
