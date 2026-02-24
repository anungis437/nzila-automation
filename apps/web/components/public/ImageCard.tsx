import Image from 'next/image';
import { ReactNode } from 'react';

interface ImageCardProps {
  src: string;
  alt: string;
  children: ReactNode;
  className?: string;
  overlay?: 'dark' | 'gradient' | 'none';
  aspect?: 'video' | 'square' | 'wide';
}

export default function ImageCard({
  src,
  alt,
  children,
  className = '',
  overlay = 'dark',
  aspect = 'video',
}: ImageCardProps) {
  const aspectClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    wide: 'aspect-[21/9]',
  };

  const overlayClasses = {
    dark: 'bg-linear-to-t from-black/80 via-black/40 to-black/20',
    gradient: 'bg-linear-to-br from-navy/90 via-electric/30 to-violet/40',
    none: '',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl group ${aspectClasses[aspect]} ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      <div className={`absolute inset-0 ${overlayClasses[overlay]}`} />
      <div className="relative z-10 h-full flex flex-col justify-end p-6">
        {children}
      </div>
    </div>
  );
}
