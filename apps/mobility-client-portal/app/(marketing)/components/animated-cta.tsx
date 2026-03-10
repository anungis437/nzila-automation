"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function AnimatedCTA() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="glass-card rounded-3xl px-8 py-16 text-center md:px-16"
    >
      <h2 className="mb-4 text-3xl font-bold text-white md:text-5xl">
        Check on Your Application{" "}
        <span className="gradient-text">Right Now</span>
      </h2>
      <p className="mx-auto mb-10 max-w-xl text-lg text-gray-300">
        Sign in to see your latest case updates, upload documents your advisor
        has requested, and message your team.
      </p>
      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
          <Link
            href="/sign-in"
            className="btn-press inline-flex items-center gap-2 rounded-xl bg-teal px-8 py-4 text-lg font-bold text-white shadow-lg shadow-teal/30 transition-colors hover:bg-teal-light"
          >
            Access My Cases <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
          <Link
            href="/sign-up"
            className="btn-press inline-flex items-center rounded-xl border border-white/20 bg-white/10 px-8 py-4 text-lg font-bold text-white transition-colors hover:bg-white/20"
          >
            Create Account
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
