"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  FileUp,
  Users,
  MessageSquare,
  Bell,
  ShieldCheck,
  Check,
} from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const features = [
  {
    icon: BarChart3,
    title: "Live Case Progress",
    bullets: [
      "Visual progress tracker from intake to approval",
      "Real-time status updates and milestone alerts",
      "Timeline view with estimated completion dates",
    ],
  },
  {
    icon: FileUp,
    title: "Secure Document Upload",
    bullets: [
      "Upload passports, bank statements, certificates",
      "Document verification status at a glance",
      "Automatic reminders for missing items",
    ],
  },
  {
    icon: Users,
    title: "Family Dashboard",
    bullets: [
      "Track dependents across all applications",
      "Passport expiry and document status per member",
      "Unified family case overview",
    ],
  },
  {
    icon: MessageSquare,
    title: "Advisor Messaging",
    bullets: [
      "Encrypted direct messaging with your advisor",
      "All conversations logged for your records",
      "File sharing within the chat",
    ],
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    bullets: [
      "Email and WhatsApp alerts on status changes",
      "Document verification confirmations",
      "Deadline and action-required reminders",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Bank-Grade Security",
    bullets: [
      "256-bit AES encryption for all data",
      "Immutable hash-chained audit trails",
      "GDPR and POPIA compliant handling",
    ],
  },
];

export default function AnimatedFeatures() {
  return (
    <div>
      <div className="mb-16 text-center">
        <span className="mb-4 inline-block rounded-full bg-teal/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-teal">
          Features
        </span>
        <h2 className="text-3xl font-bold text-navy md:text-5xl">
          Everything You Need
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-gray-600">
          A secure, intuitive portal designed to keep you informed and in
          control at every stage of your immigration journey.
        </p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
      >
        {features.map((feature) => (
          <motion.div
            key={feature.title}
            variants={itemVariants}
            className="hover-lift group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal/10">
              <feature.icon className="h-6 w-6 text-teal" />
            </div>
            <h3 className="mb-3 text-lg font-semibold text-navy">
              {feature.title}
            </h3>
            <ul className="space-y-2">
              {feature.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex items-start gap-2 text-sm text-gray-600"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                  {bullet}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
