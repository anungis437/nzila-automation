# UnionEyes Public Site Images

This directory contains all images used in the UnionEyes public marketing site.

## 📁 Directory Structure

```
public/images/
├── hero/              # Hero section banner images
├── features/          # Feature card illustrations (SVG)
├── testimonials/      # Member testimonial avatars
├── backgrounds/       # Background patterns and textures
└── ATTRIBUTIONS.md    # Required image credits
```

## 🎨 Image Sources

### Hero Images

- **Source**: Unsplash (<https://unsplash.com>)
- **License**: Unsplash License (free for commercial use)
- **Dimensions**: 1920x1080 (optimized for web)
- **Format**: JPG (quality 90)

### Feature Illustrations

- **Source**: unDraw (<https://undraw.co>)
- **License**: Open source, free to use
- **Format**: SVG (customizable colors)
- **Illustrations**:
  - `claims.svg` - File manager
  - `voting.svg` - Democracy
  - `tracking.svg` - Real-time sync
  - `transparency.svg` - Security
  - `mobile.svg` - Mobile app
  - `support.svg` - Support

### Testimonial Avatars

- **Source**: Unsplash (various professional photographers)
- **License**: Unsplash License
- **Dimensions**: 400x400 (square)
- **Format**: JPG (quality 90)
- **Files**:
  - `avatar-maria.jpg` - Maria T., Union Steward
  - `avatar-james.jpg` - James R., Local President
  - `avatar-lisa.jpg` - Lisa K., Union Member
  - `avatar-david.jpg` - David M., Labor Relations Officer
  - `avatar-sarah.jpg` - Sarah P., Union Secretary

### Background Patterns

- **Source**: Unsplash
- **License**: Unsplash License
- **Usage**: Subtle texture overlays
- **Format**: JPG (high quality)

## 📥 Downloading Images

To download all images, run the PowerShell script:

```powershell
# From the project root
cd UnionEyes
.\scripts\download-images.ps1
```

This will:

1. Download hero images from Unsplash
2. Download testimonial avatars from Unsplash
3. Download feature illustrations from unDraw
4. Download background patterns
5. Create ATTRIBUTIONS.md with full credits

## 🔧 Image Components

The project includes optimized image components in `components/ui/optimized-image.tsx`:

- **OptimizedImage**: General-purpose image with Next.js optimization
- **AvatarImage**: Circular avatars for testimonials
- **HeroImage**: Large hero sections with optional overlay
- **FeatureIcon**: SVG illustrations for feature cards

### Usage Examples

```tsx
// Hero image with overlay
<HeroImage
  src="/images/hero/hero-teamwork.jpg"
  alt="Team collaboration"
  overlay={true}
  className="h-[600px]"
/>

// Avatar in testimonials
<AvatarImage
  src="/images/testimonials/avatar-maria.jpg"
  alt="Maria T."
  size="md"
/>

// Feature illustration
<FeatureIcon
  src="/images/features/claims.svg"
  alt="Claims tracking"
  size={120}
/>
```

## ⚡ Performance

All images are optimized using Next.js Image component:

- Automatic lazy loading
- Responsive sizing
- WebP format when supported
- Proper caching headers
- Blur-up placeholders

## 📜 Attribution

Per licensing requirements, all images are credited in:

1. `/public/images/ATTRIBUTIONS.md` - Full detailed credits
2. Attribution footer on public pages - Visible credits

## 🔄 Updating Images

To replace an image:

1. Add new image to appropriate directory
2. Update component references
3. Update ATTRIBUTIONS.md with new credits
4. Test responsive behavior

## 🎨 Customization

### Changing Brand Colors in SVG Illustrations

unDraw illustrations can be customized:

1. Edit SVG files directly
2. Or use unDraw's color picker when downloading
3. Match to your brand's primary color (#6366f1 - Indigo)

### Image Dimensions

Recommended dimensions:

- Hero: 1920x1080 (landscape)
- Avatars: 400x400 (square)
- Features: SVG (scalable)
- Backgrounds: 1920x1080+

## 📄 Licenses Summary

All images use permissive licenses:

- **Unsplash License**: Free for commercial use, attribution appreciated
- **unDraw**: Open source, no attribution required

See ATTRIBUTIONS.md for detailed credits and license information.

## 🚀 Next Steps

After downloading images:

1. ✅ Run build to generate optimized versions
2. ✅ Test responsive behavior on mobile/tablet
3. ✅ Verify all images load correctly
4. ✅ Check attribution footer displays properly
5. ✅ Test page load performance

## 💡 Tips

- Images are gitignored (optional) - run download script in CI/CD
- Use next/image for all images (automatic optimization)
- Test with slow 3G to verify performance
- Consider adding blur placeholders for better UX
- Keep source images in high quality (optimization is automatic)
