import Image from 'next/image'
import { cn } from '@/app/lib/utils'

export function Logo({
  size = 26,
  className,
  alt = 'Robin logo',
}: {
  size?: number
  className?: string
  alt?: string
}) {
  return (
    <Image
      src="/logo.png"
      alt={alt}
      width={size}
      height={size}
      className={cn('h-auto w-auto', className)}
      priority
    />
  )
}

