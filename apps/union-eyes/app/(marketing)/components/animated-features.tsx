"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Scale, Users, MessageSquare, BarChart3, Shield, Brain } from "lucide-react";
import { motion } from "framer-motion";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

export default function AnimatedFeatures() {
  return (
    <>
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Labor Unions</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Comprehensive tools to support your members and strengthen your union
        </p>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Grievance Management</CardTitle>
              <CardDescription>AI-powered grievance tracking and resolution with legal precedent analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {["Smart categorization", "Timeline tracking", "Document management"].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Member Portal</CardTitle>
              <CardDescription>Self-service portal for members to manage claims and access resources</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {["Claims submission", "Document upload", "Status tracking"].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>AI Workbench</CardTitle>
              <CardDescription>Intelligent assistance for research, analysis, and decision-making</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {["Legal research", "Contract analysis", "Strategic insights"].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Communication Hub</CardTitle>
              <CardDescription>Centralized communication tools for member engagement and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {["Notifications", "Announcements", "Voting system"].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Analytics & Reporting</CardTitle>
              <CardDescription>Data-driven insights to optimize union operations and member support</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {["Case analytics", "Trend analysis", "Performance metrics"].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Secure & Compliant</CardTitle>
              <CardDescription>Enterprise-grade security with role-based access control</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {["Data encryption", "Audit logs", "GDPR compliant"].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </>
  );
} 
