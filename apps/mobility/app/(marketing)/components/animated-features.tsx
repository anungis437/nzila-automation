"use client";

import {
  Globe,
  FileCheck,
  Shield,
  Users,
  Brain,
  BarChart3,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

const features = [
  {
    icon: Globe,
    title: "Program Intelligence",
    description:
      "40+ residency and citizenship programs across 25 countries with real-time eligibility matching",
    points: [
      "Automated eligibility scoring",
      "Investment threshold matching",
      "Processing time estimates",
    ],
  },
  {
    icon: FileCheck,
    title: "Case Management",
    description:
      "End-to-end lifecycle tracking from intake to passport, with 13-stage case pipeline",
    points: [
      "8-stage progress tracking",
      "Document verification",
      "Deadline management",
    ],
  },
  {
    icon: Shield,
    title: "Compliance Engine",
    description:
      "Built-in KYC/AML workflows, risk scoring, PEP screening, and regulatory audit trails",
    points: [
      "6-step compliance workflow",
      "Automated risk scoring",
      "Two-step approval for PEPs",
    ],
  },
  {
    icon: Users,
    title: "Client Portal",
    description:
      "White-label portal for clients to track applications, upload documents, and message advisors",
    points: [
      "Real-time case progress",
      "Secure document upload",
      "Family member tracking",
    ],
  },
  {
    icon: Brain,
    title: "AI Advisory Copilot",
    description:
      "AI-powered client summaries, program comparisons, and case memos with human-in-the-loop governance",
    points: [
      "Client intake summaries",
      "Program comparison reports",
      "Governed AI outputs",
    ],
  },
  {
    icon: BarChart3,
    title: "Analytics & Reporting",
    description:
      "Pipeline analytics, conversion rates, compliance metrics, and firm-wide performance dashboards",
    points: [
      "Revenue pipeline tracking",
      "Compliance hit rates",
      "Advisor performance metrics",
    ],
  },
];

export default function AnimatedFeatures() {
  return (
    <>
      <motion.div
        className="mb-16 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <span className="mb-4 inline-block rounded-full bg-amber/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber">
          Platform
        </span>
        <h2 className="mb-4 text-3xl font-bold text-navy md:text-5xl">
          Everything an Immigration Firm Needs
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          From client intake to passport delivery — one platform replacing
          spreadsheets, email chains, and disconnected tools.
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {features.map((feature) => (
          <motion.div key={feature.title} variants={itemVariants}>
            <div className="hover-lift group flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <div className="mb-4 w-fit rounded-xl bg-amber/10 p-3">
                <feature.icon className="h-6 w-6 text-amber" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-navy">
                {feature.title}
              </h3>
              <p className="mb-5 text-sm leading-relaxed text-gray-600">
                {feature.description}
              </p>
              <ul className="mt-auto space-y-2">
                {feature.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <Check className="h-4 w-4 flex-shrink-0 text-emerald" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </>
  );
}
