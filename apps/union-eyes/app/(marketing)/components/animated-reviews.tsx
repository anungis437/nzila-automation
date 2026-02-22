"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { User, Quote, TrendingUp, Video, Zap, Clock, Award, BarChart } from "lucide-react";

interface Review {
  name: string;
  title: string;
  content: string;
  rating: number;
  icon?: React.ReactNode;
}

interface AnimatedReviewsProps {
  reviews: Review[];
}

// Reviews specifically for TrendFeed - an app that automatically creates
// content on TikTok from viral trending news
const trendFeedReviews: Review[] = [
  {
    name: "Alex Johnson",
    title: "Content Creator",
    content: "TrendFeed has completely transformed my content strategy. The AI analyzes breaking news and automatically turns it into TikTok-ready clips with perfect captions and hooks. My videos get 3x more views since I started using it!",
    rating: 5,
    icon: <TrendingUp className="h-5 w-5 text-primary" />
  },
  {
    name: "Sarah Miller",
    title: "Digital Marketing Manager",
    content: "TrendFeed's news-to-TikTok pipeline is revolutionary. Our brand stays relevant with zero effort - it detects trending stories, creates compelling videos, and even schedules posts at optimal times. The ROI is incredible for our agency.",
    rating: 5,
    icon: <Zap className="h-5 w-5 text-primary" />
  },
  {
    name: "David Chen",
    title: "News Blogger",
    content: "As a news creator, TrendFeed is indispensable. It monitors 1000+ sources 24/7 and transforms breaking stories into viral TikTok content before competitors even know what&apos;s trending. My follower growth has been exponential.",
    rating: 5,
    icon: <Clock className="h-5 w-5 text-primary" />
  },
  {
    name: "Emily Rodriguez",
    title: "Lifestyle Influencer",
    content: "TrendFeed's AI is surprisingly creative. It takes trending news and adapts it perfectly to my niche and personal style. The voice matching technology makes every video sound authentically like me - my audience can&apos;t tell the difference!",
    rating: 5,
    icon: <Video className="h-5 w-5 text-primary" />
  },
  {
    name: "James Wilson",
    title: "Small Business Owner",
    content: "TrendFeed helped us go viral by connecting our products to trending stories. The custom analytics dashboard shows exactly which news-based content drives sales. We've seen 40% more TikTok-driven conversions in just weeks.",
    rating: 5,
    icon: <BarChart className="h-5 w-5 text-primary" />
  },
  {
    name: "Michelle Parker",
    title: "Social Media Consultant",
    content: "My clients see immediate results with TrendFeed. The platform's trend prediction algorithm identifies viral news stories hours before they blow up. Combined with auto-generation of native TikTok content, it&apos;s an unbeatable advantage.",
    rating: 5,
    icon: <Award className="h-5 w-5 text-primary" />
  }
];

export default function AnimatedReviews({ reviews = trendFeedReviews }: AnimatedReviewsProps) {
  // Create a continuous loop by duplicating the reviews multiple times to prevent gaps
  // This ensures that the full width is covered throughout the animation
  const allReviews = [...reviews, ...reviews, ...reviews, ...reviews];
  
  // Control initial animation display
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Small delay to ensure animations run properly after mount
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <>
      <motion.div
        className="text-center mb-16" 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-4">What TrendFeed Users Say</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Join thousands of creators automating viral TikTok content from trending news
        </p>
      </motion.div>

      <div className="carousel-container py-4">
        <div className={`flex items-stretch gap-6 px-4 ${isVisible ? 'animate-carousel' : ''}`}>
          {allReviews.map((review, index) => (
            <motion.div
              key={`review-${index}`}
              className="flex-none w-full sm:w-[360px] md:w-[400px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.5 }}
            >
              <Card className="h-full flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border-t-4 border-t-primary/70">
                <CardHeader className="pb-2 relative">
                  <div className="absolute top-3 right-3 text-primary/20">
                    <Quote size={42} />
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                      {review.icon || <User className="h-5 w-5 text-primary" />}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{review.name}</CardTitle>
                      <CardDescription>{review.title}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center pt-2">
                    {[...Array(5)].map((_, i) => (
                      <svg 
                        key={i} 
                        className="w-4 h-4 text-yellow-400" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow pt-0">
                  <p className="text-foreground/90 italic leading-relaxed">&quot;{review.content}&quot;</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
} 
