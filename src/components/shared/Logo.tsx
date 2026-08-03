import Image from "next/image"

interface LogoProps {
  className?: string
  alt?: string
}

export default function Logo({ className = "", alt = "Textile Impressions Logo" }: LogoProps) {
  return (
    <div className={`relative ${className}`}>
      <Image
        src="/logo_transparent.png"
        alt={alt}
        fill
        className="object-contain"
        sizes="(max-width: 768px) 120px, 180px"
        priority
      />
    </div>
  )
}
