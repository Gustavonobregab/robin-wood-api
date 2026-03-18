// dashboard/app/components/landing/Features.tsx
import { FileText, Music, Image as ImageIcon } from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: 'Text compression',
    description: 'Trim, shorten, minify, or summarize. Multiple operations, one API call.',
  },
  {
    icon: Music,
    title: 'Audio compression',
    description: 'Remove silence, normalize, speed up. Optimized presets for podcasts and lectures.',
  },
  {
    icon: ImageIcon,
    title: 'Image compression',
    description: 'Smart compression that keeps your images looking sharp. Coming soon.',
  },
]

export function Features() {
  return (
    <section id="features" className="bg-background-section py-24">
      <div className="max-w-6xl mx-auto px-8">
        <h2 className="text-3xl font-bold text-center mb-4">Everything you need</h2>
        <p className="text-muted text-center mb-16">One platform, three types of compression.</p>
        <div className="grid grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-background rounded-xl p-6 shadow-sm border border-border">
              <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-muted text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
