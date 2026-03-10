"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function AnimatedCTA() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="glass-card mx-auto max-w-3xl rounded-2xl p-8 text-center md:p-12"
    >
      <h3 className="mb-3 text-2xl font-bold text-white md:text-3xl">
        Ready to Modernize Your Practice?
      </h3>
      <p className="mx-auto mb-8 max-w-xl text-lg text-white/70">
        Join forward-thinking migration firms using Global Mobility OS to
        deliver faster, more compliant outcomes. Launch your pilot in under
        one week.
      </p>

      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
          <Link
            href="/sign-up"
            className="btn-press inline-flex items-center gap-2 rounded-xl bg-amber px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber/25 transition-colors hover:bg-amber-light"
          >
            Start Free Pilot <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
          <Link
            href="/sign-in"
            className="btn-press inline-flex items-center rounded-xl border border-white/30 px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Sign In
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
