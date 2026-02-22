/**
 * Landing page for Template App
 * Modern and attractive marketing page showcasing the app's features
 * Uses ShadCN components for consistent styling and separate client components for animations
 */
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight, Code, Database, Lock, Github, Twitter } from "lucide-react";
import Link from "next/link";
import AnimatedHero from "./components/animated-hero";
import AnimatedFeatures from "./components/animated-features";
import AnimatedReviews from "./components/animated-reviews";
import AnimatedCTA from "./components/animated-cta";

export const dynamic = 'force-dynamic';

// Reviews data
const reviews = [
  {
    name: "Maria S.",
    title: "Union Steward, UFCW Local 175",
    content: "UnionEyes has transformed how we handle grievances. The AI-powered analysis helps us build stronger cases, and our members love the self-service portal.",
    rating: 5
  },
  {
    name: "James T.",
    title: "Business Representative",
    content: "The grievance tracking system is incredible. We can now see trends across all cases and respond more strategically. Response times have improved by 40%.",
    rating: 5
  },
  {
    name: "Patricia L.",
    title: "Union President",
    content: "Finally, a platform built specifically for unions! The analytics help us make data-driven decisions, and the member engagement features have strengthened our community.",
    rating: 5
  },
  {
    name: "Robert M.",
    title: "Legal Coordinator",
    content: "The AI Workbench's contract analysis and legal research capabilities are game-changing. It&apos;s like having a research assistant available 24/7.",
    rating: 5
  },
  {
    name: "Angela K.",
    title: "Communications Director",
    content: "The communication hub has made it so much easier to keep our members informed. The voting system for union decisions is secure and accessible.",
    rating: 5
  }
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 md:px-6 lg:py-32 relative bg-gradient-to-b from-background to-background/95">
        {/* Texture overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5OTk5OTkiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNi02aDZ2LTZoLTZ2NnptLTEyIDEyaDZ2LTZoLTZ2NnptLTYtNmg2di02aC02djZ6bS02LTZoNnYtNmgtNnY2em0xMi0xMmg2di02aC02djZ6bTYtNmg2VjZoLTZ2NnptLTYtNnY2aDZWNmgtNnptLTYgMTJoNnYtNmgtNnY2em0tNi02aDZWNmgtNnY2eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50 mix-blend-soft-light pointer-events-none"></div>
        <div className="container mx-auto max-w-5xl relative z-10">
          <AnimatedHero />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 md:px-6 bg-secondary/20">
        <div className="container mx-auto max-w-6xl">
          <AnimatedFeatures />
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-20 px-4 md:px-6 bg-background">
        <div className="container mx-auto max-w-6xl">
          <AnimatedReviews reviews={reviews} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-6 bg-secondary/20">
        <div className="container mx-auto max-w-4xl">
          <AnimatedCTA />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-12 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold mb-4">UnionEyes</h3>
              <p className="text-muted-foreground max-w-md">
                Empowering labor unions with AI-driven tools for grievance management, member engagement, and operational excellence.
              </p>
              <div className="flex space-x-4 mt-6">
                <Button variant="ghost" size="icon" asChild>
                  <Link href="https://github.com" target="_blank" rel="noopener noreferrer">
                    <Github className="h-5 w-5" />
                    <span className="sr-only">GitHub</span>
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                    <Twitter className="h-5 w-5" />
                    <span className="sr-only">Twitter</span>
                  </Link>
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Platform</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Case Studies</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} UnionEyes. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link href="#" className="text-muted-foreground text-sm hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="#" className="text-muted-foreground text-sm hover:text-foreground transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

