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
  heading = "Trusted by Leading Migration Firms",
  subtitle = "Advisors and principals across investment migration rely on Global Mobility OS",
}: AnimatedReviewsProps) {
  const allReviews = [...reviews, ...reviews, ...reviews, ...reviews];
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <motion.div
        className="mb-16 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="mb-4 text-3xl font-bold md:text-4xl">{heading}</h2>
        <p className="mx-auto max-w-2xl text-lg text-gray-500">{subtitle}</p>
      </motion.div>

      <div className="carousel-container py-4">
        <div
          className={`flex items-stretch gap-6 px-4 ${
            isVisible ? "animate-carousel" : ""
          }`}
        >
          {allReviews.map((review, index) => (
            <motion.div
              key={`review-${index}`}
              className="w-full flex-none sm:w-90 md:w-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: Math.min(index * 0.05, 0.3),
                duration: 0.5,
              }}
            >
              <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-md transition-shadow duration-300 hover:shadow-lg">
                <div className="relative mb-4">
                  <div className="absolute right-0 top-0 text-amber/20">
                    <Quote size={42} />
                  </div>
                  <div className="mb-3 flex items-center gap-3">
                    <div className="rounded-full bg-amber/10 p-2">
                      <User className="h-5 w-5 text-amber" />
                    </div>
                    <div>
                      <p className="font-semibold text-navy">{review.name}</p>
                      <p className="text-sm text-gray-500">{review.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center pt-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? "text-amber-light"
                            : "text-gray-200"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="grow text-sm italic leading-relaxed text-gray-700">
                  &quot;{review.content}&quot;
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}
