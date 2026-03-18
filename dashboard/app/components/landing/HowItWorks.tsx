// dashboard/app/components/landing/HowItWorks.tsx
const steps = [
  { n: '01', title: 'Get an API key', description: 'Sign up and create your first API key in seconds.' },
  { n: '02', title: 'Send a URL', description: 'Pass a URL to your file. Robin fetches, processes, and returns the result.' },
  { n: '03', title: 'Download the output', description: 'Get a link to the compressed file or copy the compressed text.' },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-background py-24">
      <div className="max-w-6xl mx-auto px-8">
        <h2 className="text-3xl font-bold text-center mb-4">How it works</h2>
        <p className="text-muted text-center mb-16">Three steps to smaller files.</p>
        <div className="grid grid-cols-3 gap-8">
          {steps.map(({ n, title, description }) => (
            <div key={n} className="text-center">
              <div className="text-5xl font-bold text-accent-light mb-4">{n}</div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-muted text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
