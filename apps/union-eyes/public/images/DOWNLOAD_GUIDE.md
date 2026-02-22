# Image Download Guide

## Current State: SVG Placeholders

All images are currently **high-quality SVG placeholders** that provide visual structure. The marketing site is fully functional with these placeholders.

## Recommended: Upgrade to Real Photos

For production, replace placeholders with actual photos:

### Option 1: Using Pexels (Recommended - Free, No API Required)

```powershell
# Hero Image (teamwork/collaboration)
Invoke-WebRequest "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1920" -OutFile "public\images\hero\hero-teamwork.jpg" -UseBasicParsing

# Testimonial Avatars (diverse professionals)
Invoke-WebRequest "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400" -OutFile "public\images\testimonials\avatar-maria.jpg" -UseBasicParsing

Invoke-WebRequest "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400" -OutFile "public\images\testimonials\avatar-james.jpg" -UseBasicParsing

Invoke-WebRequest "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400" -OutFile "public\images\testimonials\avatar-lisa.jpg" -UseBasicParsing

Invoke-WebRequest "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400" -OutFile "public\images\testimonials\avatar-david.jpg" -UseBasicParsing

Invoke-WebRequest "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400" -OutFile "public\images\testimonials\avatar-sarah.jpg" -UseBasicParsing

# Background Pattern
Invoke-WebRequest "https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=1920" -OutFile "public\images\backgrounds\pattern-subtle.jpg" -UseBasicParsing
```

After downloading, update file extensions in components:

- `animated-hero.tsx`: Change `.svg` to `.jpg` in hero image src
- `animated-reviews.tsx`: Change `.svg` to `.jpg` in avatar image src

### Option 2: Using Pixabay (Also Free)

Search for images manually at <https://pixabay.com> and download:

- Hero: Search "team collaboration business"
- Avatars: Search "professional portrait" (get 5 diverse photos)
- Background: Search "minimal pattern abstract"

### Option 3: Custom Photography

Use your own photos or hire a photographer for authentic brand imagery.

## Current Placeholder Benefits

The SVG placeholders provide:

- ✅ Zero load time (inline, scalable)
- ✅ Professional gradient designs
- ✅ Perfect responsive scaling
- ✅ Accessible color contrast
- ✅ Branded colors (matching UnionEyes palette)

## When to Upgrade

Consider keeping SVG placeholders if:

- Building prototype/MVP quickly
- Testing layout and UX first
- Budget constraints for photography

Upgrade to photos when:

- Launching to production
- Building trust with real testimonials
- Showcasing actual team/product

## Attribution

All current SVG images are custom-created and require no attribution. If you download from Pexels/Pixabay, check individual photo licenses (most are CC0 Public Domain).
