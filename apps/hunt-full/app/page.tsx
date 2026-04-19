export default function HomePage() {
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>the-hunt</h1>
      <p>Candidate profile building and opportunity tracking</p>
      <ul>
        <li><a href="/candidate">Candidate</a></li>
        <li><a href="/tracker">Tracker</a></li>
      </ul>
    </main>
  )
}
