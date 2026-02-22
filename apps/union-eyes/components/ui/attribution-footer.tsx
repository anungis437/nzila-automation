/**
 * Attribution Footer Component
 * Credits photographers and illustrators for images used in the public site
 */
import Link from "next/link";

export function AttributionFooter() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Image Credits */}
          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider">Image Credits</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Photos by talented photographers on{" "}
              <Link 
                href="https://unsplash.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Unsplash
              </Link>
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>Hero: Headway</li>
              <li>Avatars: Various contributors</li>
            </ul>
          </div>

          {/* Illustration Credits */}
          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider">Illustrations</h3>
            <p className="text-sm text-muted-foreground">
              Feature illustrations from{" "}
              <Link 
                href="https://undraw.co" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                unDraw
              </Link>
              {" "}by Katerina Limpitsouni
            </p>
          </div>

          {/* License Info */}
          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider">Licenses</h3>
            <p className="text-xs text-muted-foreground">
              All images are used under their respective open licenses and are free for commercial use.
              {" "}
              <Link 
                href="/images/ATTRIBUTIONS.md" 
                target="_blank"
                className="text-primary hover:underline"
              >
                Full attribution details
              </Link>
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} UnionEyes. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

