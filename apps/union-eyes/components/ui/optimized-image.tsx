/**
 * Optimized Image Component
 * Wrapper around Next.js Image with consistent defaults and responsive behavior
 */
import Image from "next/image";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  rounded?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  sizes,
  quality = 85,
  objectFit = "cover",
  rounded = false,
}: OptimizedImageProps) {
  const imageClasses = cn(
    rounded && "rounded-lg",
    className
  );

  if (fill) {
    return (
      <div className={cn("relative", className)}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes || "100vw"}
          quality={quality}
          priority={priority}
          className={imageClasses}
          style={{ objectFit }}
        />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width || 800}
      height={height || 600}
      sizes={sizes}
      quality={quality}
      priority={priority}
      className={imageClasses}
      style={{ objectFit }}
    />
  );
}

/**
 * Avatar Image Component
 * Specialized for testimonial/profile images with circular styling
 */
interface AvatarImageProps {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function AvatarImage({ 
  src, 
  alt, 
  size = "md",
  className 
}: AvatarImageProps) {
  const sizeMap = {
    sm: 40,
    md: 64,
    lg: 96,
    xl: 128,
  };

  const dimension = sizeMap[size];

  return (
    <div className={cn("relative overflow-hidden rounded-full", className)}>
      <Image
        src={src}
        alt={alt}
        width={dimension}
        height={dimension}
        quality={90}
        className="object-cover"
      />
    </div>
  );
}

/**
 * Hero Image Component
 * Optimized for large hero sections with proper responsive behavior
 */
interface HeroImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  overlay?: boolean;
  overlayOpacity?: number;
}

export function HeroImage({
  src,
  alt,
  className,
  priority = true,
  overlay = false,
  overlayOpacity = 0.4,
}: HeroImageProps) {
  return (
    <div className={cn("relative w-full h-full", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="100vw"
        quality={90}
        priority={priority}
        className="object-cover"
      />
      {overlay && (
        <div 
          className="absolute inset-0 bg-gradient-to-b from-background/80 to-background/40"
          data-overlay-opacity={overlayOpacity}
        />
      )}
    </div>
  );
}

/**
 * Feature Icon Component
 * For SVG illustrations in feature sections
 */
interface FeatureIconProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}

export function FeatureIcon({ 
  src, 
  alt, 
  size = 200,
  className 
}: FeatureIconProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="w-full h-auto"
        priority={false}
      />
    </div>
  );
}

