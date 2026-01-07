export default function AboutPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-white mb-6">About SIMD Tracker</h1>

        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-2xl font-bold text-white mb-3">What is SIMD Tracker?</h2>
            <p className="leading-relaxed">
              SIMD Tracker is a real-time monitoring tool for Solana Improvement Documents (SIMDs).
              We aggregate data from GitHub to provide developers, validators, and community members
              with up-to-date information about proposed protocol improvements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">What are SIMDs?</h2>
            <p className="leading-relaxed mb-4">
              Solana Improvement Documents (SIMDs) are design documents that describe new features,
              improvements, or changes to the Solana protocol. They serve as the primary mechanism
              for proposing and discussing changes to Solana.
            </p>
            <p className="leading-relaxed">
              Each SIMD goes through a review process involving community discussion, technical review,
              and eventual implementation. Our tracker helps you follow this process in real-time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">Features</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Real-time tracking of all SIMD proposals</li>
              <li>Live activity monitoring from GitHub</li>
              <li>Detailed proposal views with full content</li>
              <li>Discussion summaries and latest messages</li>
              <li>Weekly newsletter with important updates</li>
              <li>Filtering and sorting by activity, status, and more</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">Data Source</h2>
            <p className="leading-relaxed">
              All data is sourced directly from the official{' '}
              <a
                href="https://github.com/solana-foundation/solana-improvement-documents"
                target="_blank"
                rel="noopener noreferrer"
                className="text-solana-blue hover:text-solana-green transition-colors underline"
              >
                Solana Improvement Documents repository
              </a>{' '}
              on GitHub. We monitor pull requests, commits, and discussions to provide the most
              accurate and timely information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-3">Contact</h2>
            <p className="leading-relaxed">
              Questions or feedback? Reach out to us on{' '}
              <a
                href="https://github.com/Jars1987/SIMDigest.git"
                target="_blank"
                rel="noopener noreferrer"
                className="text-solana-blue hover:text-solana-green transition-colors underline"
              >
                GitHub
              </a>{' '}
              or{' '}
              <a
                href="https://x.com/Joserelvassant1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-solana-blue hover:text-solana-green transition-colors underline"
              >
                X (Twitter)
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
