"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { User, Quote } from "lucide-react";

interface Review {
  name: string;
  title: string;
  content: string;
  rating: number;
}

interface AnimatedReviewsProps {
  reviews: Review[];
  heading?: string;
  subtitle?: string;
}

export default function AnimatedReviews({
  reviews,
  heading = "What Our Clients Say",
  subtitle = "Real feedback from individuals and families navigating their immigration journey",
}: AnimatedReviewsProps) {
  const allReviews = [...reviews, ...reviews, ...reviews, ...reviews];
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);
  if (!isClient) return null;

  return (
    <div>
      <div className="mb-16 text-center">
        <span className="mb-4 inline-block rounded-full bg-teal/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-teal">
          Testimonials
        </span>
        <h2 className="text-3xl font-bold text-navy md:text-5xl">{heading}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-gray-600">{subtitle}</p>
      </div>

      <div className="carousel-container">
        <motion.div className="animate-carousel flex gap-6">
          {allReviews.map((review, i) => (
            <div
              key={`${review.name}-${i}`}
              className="w-[340px] shrink-0 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <Quote className="mb-3 h-6 w-6 text-teal/30" />
              <p className="mb-4 text-sm leading-relaxed text-gray-600">
                &ldquo;{review.content}&rdquo;
              </p>
              <div className="flex items-center gap-2 text-xs text-amber">
                {Array.from({ length: review.rating }).map((_, j) => (
                  <span key={j}>★</span>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal/10">
                  <User className="h-4 w-4 text-teal" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy">
                    {review.name}
                  </p>
                  <p className="text-xs text-gray-500">{review.title}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
