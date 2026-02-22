"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { motion } from "framer-motion";
import { SignedOut } from "@clerk/clerk-react";

export default function AnimatedCTA() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">Ready to Transform Your Union?</CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Join progressive unions using UnionEyes to better serve their members
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col sm:flex-row gap-4">
          <Button variant="secondary" size="lg" asChild>
            <Link href="/dashboard">Get Started Free</Link>
          </Button>
          <Button
            variant="outline"
            className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
            size="lg"
            asChild
          >
            <Link href="#" >Schedule Demo</Link>
          </Button>
          <SignedOut>
            <Link href="/login?redirect_url=/dashboard">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="font-medium rounded-xl bg-white/70 hover:bg-white/90 shadow-sm border border-white/60 text-gray-800 relative overflow-hidden group"
                >
                  <motion.span 
                    className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0"
                    animate={{ 
                      x: ['-100%', '200%'],
                    }}
                    transition={{ 
                      duration: 2.5, 
                      ease: "easeInOut",
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                  />
                  <span className="relative z-10">Sign In</span>
                </Button>
              </motion.div>
            </Link>
          </SignedOut>
        </CardFooter>
      </Card>
    </motion.div>
  );
} 
