/**
 * Sidebar component for UnionEyes
 * Provides comprehensive navigation for union stakeholders with role-based access
 * Supports members, stewards, officers, and administrators
 */
"use client";

import { 
  Home, 
  Settings, 
  FileText, 
  Users, 
  Vote, 
  BookOpen, 
  Shield, 
  BarChart3, 
  Mic,
  FileBarChart,
  Bell,
  Scale,
  Library,
  GitCompare,
  Target,
  Building2,
  Network,
  Briefcase,
  Flag,
  DollarSign,
  GraduationCap,
  MessageSquare,
  AlertTriangle,
  Handshake,
  Receipt,
  Activity
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { SelectProfile } from "@/db/schema/domains/member";
import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect } from "react";

interface SidebarProps {
  profile: SelectProfile | null;
  userEmail?: string;
  whopMonthlyPlanId: string;
  whopYearlyPlanId: string;
  userRole?: 
    // Base Membership
    | "member" 
    // Front-line Representatives
    | "steward" 
    | "bargaining_committee"
    // Specialized Representatives
    | "health_safety_rep"
    // Senior Representatives
    | "chief_steward" 
    | "officer"
    // Local Union Executives
    | "president" 
    | "vice_president" 
    | "secretary_treasurer"
    | "admin"
    // Union National Level
    | "national_officer"
    // System Administration
    | "system_admin"
    // Federation Level
    | "fed_staff" 
    | "fed_executive"
    // CLC National Level
    | "clc_staff" 
    | "clc_executive"
    // Legacy (backward compatibility)
    | "congress_staff" 
    | "federation_staff"
    // App Operations
    | "app_owner" 
    | "coo" 
    | "cto" 
    | "platform_lead" 
    | "customer_success_director" 
    | "support_manager" 
    | "data_analytics_manager" 
    | "billing_manager" 
    | "support_agent" 
    | "data_analyst" 
    | "billing_specialist";
}

export default function Sidebar({ profile, userEmail, whopMonthlyPlanId, whopYearlyPlanId, userRole = "member" }: SidebarProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations();
  const [isMounted, setIsMounted] = useState(false);
  
  // Prevent hydration issues by only rendering UserButton on client
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const isActive = (path: string) => pathname === path;

  // Navigation organized by sections with human-friendly labels
  const getNavigationSections = () => [
    {
      title: t('sidebar.yourUnion'),
      roles: ["member", "steward", "chief_steward", "officer", "president", "vice_president", "secretary_treasurer", "bargaining_committee", "health_safety_rep", "national_officer", "admin"],
      items: [
        { href: `/${locale}/dashboard`, icon: <Home size={16} />, label: t('navigation.dashboard'), roles: ["member", "steward", "chief_steward", "officer", "president", "vice_president", "secretary_treasurer", "bargaining_committee", "health_safety_rep", "national_officer", "admin"] },
        { href: `/${locale}/dashboard/claims`, icon: <FileText size={16} />, label: t('claims.myCases'), roles: ["member", "steward", "chief_steward", "officer", "president", "vice_president", "secretary_treasurer", "bargaining_committee", "health_safety_rep", "national_officer", "admin"] },
        { href: `/${locale}/dashboard/claims/new`, icon: <Mic size={16} />, label: t('claims.submitNew'), roles: ["member", "steward", "chief_steward", "officer", "president", "vice_president", "secretary_treasurer", "bargaining_committee", "health_safety_rep", "national_officer", "admin"] },
        { href: `/${locale}/dashboard/health-safety`, icon: <Shield size={16} />, label: 'Health & Safety', roles: ["member", "steward", "chief_steward", "officer", "president", "vice_president", "secretary_treasurer", "bargaining_committee", "health_safety_rep", "national_officer", "admin"] },
        { href: `/${locale}/dashboard/pension`, icon: <Briefcase size={16} />, label: 'My Pension & Benefits', roles: ["member", "steward", "chief_steward", "officer", "president", "vice_president", "secretary_treasurer", "bargaining_committee", "health_safety_rep", "national_officer", "admin"] },
        { href: `/${locale}/dashboard/dues`, icon: <DollarSign size={16} />, label: 'Dues & Payments', roles: ["member", "steward", "chief_steward", "officer", "president", "vice_president", "secretary_treasurer", "bargaining_committee", "health_safety_rep", "national_officer", "admin"] },
      ]
    },
    {
      title: t('sidebar.participation'),
      roles: ["member", "steward", "officer", "admin"],
      items: [
        { href: `/${locale}/dashboard/education`, icon: <GraduationCap size={16} />, label: 'Education & Training', roles: ["member", "steward", "officer", "admin"] },
        { href: `/${locale}/dashboard/voting`, icon: <Vote size={16} />, label: t('navigation.vote'), roles: ["member", "steward", "officer", "admin"] },
        { href: `/${locale}/dashboard/agreements`, icon: <BookOpen size={16} />, label: t('sidebar.ourAgreements'), roles: ["member", "steward", "officer", "admin"] },
      ]
    },
    {
      title: t('sidebar.representativeTools'),
      roles: ["steward", "chief_steward", "officer", "president", "vice_president", "secretary_treasurer", "bargaining_committee", "national_officer", "admin"],
      items: [
        { href: `/${locale}/dashboard/workbench`, icon: <FileBarChart size={16} />, label: t('claims.caseQueue'), roles: ["steward", "chief_steward", "officer", "president", "vice_president", "secretary_treasurer", "bargaining_committee", "national_officer", "admin"] },
        { href: `/${locale}/dashboard/members`, icon: <Users size={16} />, label: t('members.directory'), roles: ["steward", "chief_steward", "officer", "president", "vice_president", "secretary_treasurer", "bargaining_committee", "national_officer", "admin"] },
        { href: `/${locale}/dashboard/clause-library`, icon: <Library size={16} />, label: t('sidebar.clauseLibrary'), roles: ["steward", "chief_steward", "officer", "president", "vice_president", "secretary_treasurer", "bargaining_committee", "national_officer", "admin"] },
        { href: `/${locale}/dashboard/analytics`, icon: <BarChart3 size={16} />, label: t('sidebar.insights'), roles: ["steward", "chief_steward", "officer", "president", "vice_president", "secretary_treasurer", "bargaining_committee", "national_officer", "admin"] },
        { href: `/${locale}/dashboard/precedents`, icon: <Scale size={16} />, label: 'Precedents', roles: ["steward", "chief_steward", "officer", "president", "vice_president", "secretary_treasurer", "bargaining_committee", "national_officer", "admin"] },
        { href: `/${locale}/dashboard/stewards`, icon: <Users size={16} />, label: 'Steward Management', roles: ["chief_steward", "officer", "president", "vice_president", "national_officer", "admin"] },
        { href: `/${locale}/dashboard/cross-union-analytics`, icon: <GitCompare size={16} />, label: 'Cross-Union Analytics', roles: ["officer", "president", "vice_president", "secretary_treasurer", "national_officer", "admin"] },
      ]
    },
    {
      title: 'Specialized Committees',
      roles: ["bargaining_committee", "health_safety_rep"],
      items: [
        { href: `/${locale}/dashboard/bargaining`, icon: <Handshake size={16} />, label: 'Bargaining Dashboard', roles: ["bargaining_committee"] },
        { href: `/${locale}/dashboard/health-safety`, icon: <Shield size={16} />, label: 'H&S Dashboard', roles: ["health_safety_rep"] },
      ]
    },
    {
      title: t('sidebar.leadership'),
      roles: ["officer", "president", "vice_president", "secretary_treasurer", "national_officer", "admin"],
      items: [
        { href: `/${locale}/dashboard/communications`, icon: <MessageSquare size={16} />, label: 'Communications', roles: ["officer", "president", "vice_president", "secretary_treasurer", "national_officer", "admin"] },
        { href: `/${locale}/dashboard/grievances`, icon: <Scale size={16} />, label: t('grievance.title'), roles: ["officer", "president", "vice_president", "secretary_treasurer", "national_officer", "admin"] },
        { href: `/${locale}/dashboard/bargaining`, icon: <Handshake size={16} />, label: 'Bargaining & Negotiations', roles: ["officer", "president", "vice_president", "secretary_treasurer", "bargaining_committee", "national_officer", "admin"] },
        { href: `/${locale}/dashboard/financial`, icon: <Receipt size={16} />, label: 'Financial Management', roles: ["officer", "president", "vice_president", "secretary_treasurer", "national_officer", "admin"] },
        { href: `/${locale}/dashboard/targets`, icon: <Target size={16} />, label: 'Performance Targets', roles: ["officer", "president", "vice_president", "national_officer", "admin"] },
        { href: `/${locale}/dashboard/organizing`, icon: <Flag size={16} />, label: 'Organizing Campaigns', roles: ["officer", "president", "vice_president", "national_officer", "admin"] },
        { href: `/${locale}/dashboard/strike-fund`, icon: <DollarSign size={16} />, label: 'Strike Fund', roles: ["officer", "president", "vice_president", "secretary_treasurer", "national_officer", "admin"] },
        { href: `/${locale}/dashboard/notifications`, icon: <Bell size={16} />, label: t('sidebar.alerts'), roles: ["officer", "president", "vice_president", "secretary_treasurer", "national_officer", "admin"] },
        { href: `/${locale}/dashboard/pension/admin`, icon: <Briefcase size={16} />, label: 'Pension Administration', roles: ["officer", "president", "secretary_treasurer", "national_officer", "admin"] },
        { href: `/${locale}/dashboard/pension/trustee`, icon: <Shield size={16} />, label: 'Trustee Portal', roles: ["officer", "president", "secretary_treasurer", "national_officer", "admin"] },
      ]
    },
    {
      title: 'Executive Leadership',
      roles: ["president", "vice_president", "secretary_treasurer", "national_officer"],
      items: [
        { href: `/${locale}/dashboard/executive`, icon: <Building2 size={16} />, label: 'Executive Dashboard', roles: ["president", "vice_president", "secretary_treasurer", "national_officer"] },
        { href: `/${locale}/dashboard/governance`, icon: <FileText size={16} />, label: 'Governance', roles: ["president", "vice_president", "secretary_treasurer", "national_officer"] },
        { href: `/${locale}/dashboard/audits`, icon: <FileBarChart size={16} />, label: 'Audits & Compliance', roles: ["president", "vice_president", "secretary_treasurer", "national_officer", "admin"] },
        { href: `/${locale}/dashboard/pension/trustee`, icon: <Shield size={16} />, label: 'Trustee Portal', roles: ["officer", "admin"] },
      ]
    },
    {
      title: 'Federation & CLC Services',
      roles: ["congress_staff", "federation_staff", "clc_staff", "clc_executive", "fed_staff", "fed_executive", "system_admin", "national_officer", "admin"],
      items: [
        { href: `/${locale}/dashboard/cross-union-analytics`, icon: <GitCompare size={16} />, label: 'Cross-Union Analytics', roles: ["congress_staff", "federation_staff", "clc_staff", "clc_executive", "fed_staff", "fed_executive", "system_admin", "national_officer", "admin"] },
        { href: `/${locale}/dashboard/precedents`, icon: <Scale size={16} />, label: 'Precedent Database', roles: ["congress_staff", "federation_staff", "clc_staff", "clc_executive", "fed_staff", "fed_executive", "system_admin", "national_officer", "admin"] },
        { href: `/${locale}/dashboard/clause-library`, icon: <Library size={16} />, label: 'Shared Clause Library', roles: ["congress_staff", "federation_staff", "clc_staff", "clc_executive", "fed_staff", "fed_executive", "system_admin", "national_officer", "admin"] },
        { href: `/${locale}/dashboard/admin/organizations`, icon: <Building2 size={16} />, label: 'Affiliate Management', roles: ["congress_staff", "federation_staff", "clc_staff", "clc_executive", "fed_staff", "fed_executive", "system_admin", "national_officer", "admin"] },
        { href: `/${locale}/dashboard/compliance`, icon: <FileBarChart size={16} />, label: 'Compliance Reports', roles: ["congress_staff", "federation_staff", "clc_staff", "clc_executive", "system_admin", "admin"] },
        { href: `/${locale}/dashboard/sector-analytics`, icon: <BarChart3 size={16} />, label: 'Sector Analytics', roles: ["congress_staff", "clc_staff", "clc_executive", "system_admin", "admin"] },
      ]
    },
    {
      title: 'CLC National Operations',
      roles: ["clc_staff", "clc_executive", "system_admin", "admin"],
      items: [
        { href: `/${locale}/dashboard/clc`, icon: <Building2 size={16} />, label: 'CLC Dashboard', roles: ["clc_staff", "clc_executive", "system_admin", "admin"] },
        { href: `/${locale}/dashboard/clc/affiliates`, icon: <Network size={16} />, label: 'Affiliates Management', roles: ["clc_staff", "clc_executive", "system_admin", "admin"] },
        { href: `/${locale}/dashboard/clc/staff`, icon: <Users size={16} />, label: 'CLC Staff Operations', roles: ["clc_staff", "clc_executive", "system_admin", "admin"] },
        { href: `/${locale}/dashboard/clc/compliance`, icon: <FileBarChart size={16} />, label: 'CLC Compliance', roles: ["clc_staff", "clc_executive", "system_admin", "admin"] },
      ]
    },
    {
      title: 'Provincial Federation',
      roles: ["fed_staff", "fed_executive", "system_admin", "admin"],
      items: [
        { href: `/${locale}/dashboard/federation`, icon: <Network size={16} />, label: 'Federation Dashboard', roles: ["fed_staff", "fed_executive", "system_admin", "admin"] },
        { href: `/${locale}/dashboard/federation/affiliates`, icon: <Building2 size={16} />, label: 'Affiliate Unions', roles: ["fed_staff", "fed_executive", "system_admin", "admin"] },
        { href: `/${locale}/dashboard/federation/remittances`, icon: <DollarSign size={16} />, label: 'Remittance Tracking', roles: ["fed_staff", "fed_executive", "system_admin", "admin"] },
      ]
    },
    {
      title: 'Platform Operations',
      roles: ["app_owner", "coo", "cto", "platform_lead", "customer_success_director", "support_manager", "data_analytics_manager", "billing_manager", "support_agent", "data_analyst", "billing_specialist"],
      items: [
        { href: `/${locale}/dashboard/operations`, icon: <Activity size={16} />, label: 'Operations Dashboard', roles: ["app_owner", "coo", "cto", "platform_lead"] },
        { href: `/${locale}/dashboard/customer-success`, icon: <Users size={16} />, label: 'Customer Success', roles: ["app_owner", "coo", "customer_success_director"] },
        { href: `/${locale}/dashboard/support`, icon: <AlertTriangle size={16} />, label: 'Support Center', roles: ["app_owner", "coo", "support_manager", "support_agent"] },
        { href: `/${locale}/dashboard/analytics-admin`, icon: <BarChart3 size={16} />, label: 'Platform Analytics', roles: ["app_owner", "coo", "cto", "data_analytics_manager", "data_analyst"] },
        { href: `/${locale}/dashboard/billing-admin`, icon: <DollarSign size={16} />, label: 'Billing & Subscriptions', roles: ["app_owner", "coo", "billing_manager", "billing_specialist"] },
      ]
    },
    {
      title: t('sidebar.system'),
      roles: ["admin", "system_admin"],
      items: [
        { href: `/${locale}/dashboard/admin`, icon: <Shield size={16} />, label: t('navigation.adminPanel'), roles: ["admin", "system_admin"] },
        { href: `/${locale}/dashboard/settings`, icon: <Settings size={16} />, label: t('sidebar.preferences'), roles: ["member", "steward", "chief_steward", "officer", "president", "vice_president", "secretary_treasurer", "bargaining_committee", "health_safety_rep", "national_officer", "admin", "system_admin", "congress_staff", "federation_staff", "clc_staff", "clc_executive", "fed_staff", "fed_executive", "app_owner", "coo", "cto", "platform_lead", "customer_success_director", "support_manager", "data_analytics_manager", "billing_manager"] },
      ]
    }
  ];
  
  const navigationSections = getNavigationSections();

  // Filter sections and items based on user role
  const getVisibleSections = () => {
    return navigationSections
      .map(section => ({
        ...section,
        items: section.items.filter(item => item.roles.includes(userRole))
      }))
      .filter(section => section.items.length > 0 && section.roles.includes(userRole));
  };

  const visibleSections = getVisibleSections();

  return (
    <div className="h-screen w-[60px] md:w-[220px] bg-white/60 backdrop-blur-xl border-r border-white/40 flex flex-col justify-between py-5 relative overflow-hidden">
        {/* Glassmorphism effects */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5 pointer-events-none"
          animate={{ 
            opacity: [0.4, 0.6, 0.4],
            background: [
              "linear-gradient(to bottom, rgba(var(--primary), 0.03), transparent, rgba(var(--primary), 0.03))",
              "linear-gradient(to bottom, rgba(var(--primary), 0.05), transparent, rgba(var(--primary), 0.05))",
              "linear-gradient(to bottom, rgba(var(--primary), 0.03), transparent, rgba(var(--primary), 0.03))"
            ]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Enhanced edge highlights for 3D effect */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-300/50 to-transparent" />
        <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white to-transparent opacity-80" />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white to-transparent opacity-80" />

        {/* Logo */}
        <div className="px-3 mb-8 relative z-10">
          <Link href={`/${locale}/dashboard`}>
            <motion.div 
              className="flex items-center justify-center md:justify-start gap-2"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg">
                <Shield size={18} className="text-white" />
              </div>
              <div className="hidden md:block">
                <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">UnionEyes</span>
              </div>
            </motion.div>
          </Link>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 relative z-10 overflow-y-auto">
          <div className="space-y-6">
            {visibleSections.map((section, sectionIndex) => (
              <div key={section.title}>
                {/* Section Header */}
                <div className="mb-2 px-3">
                  <h3 className="hidden md:block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    {section.title}
                  </h3>
                  <div className="md:hidden h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-2" />
                </div>
                
                {/* Section Items */}
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <Link 
                      key={item.href} 
                      href={item.href} 
                      className="block"
                    >
                      <motion.div 
                        className={`flex items-center py-2.5 px-3 rounded-lg cursor-pointer transition-all ${
                          isActive(item.href) 
                            ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30" 
                            : "text-gray-600 hover:bg-white/80 hover:shadow-sm"
                        }`}
                        whileHover={{ 
                          scale: 1.02, 
                          x: 2,
                          transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-center justify-center">
                          {item.icon}
                        </div>
                        <span className={`ml-3 hidden md:block text-sm font-medium`}>
                          {item.label}
                        </span>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Bottom Section - User Profile */}
        <div className="mt-auto pt-4 relative z-10">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-3" />
          
          {/* User Profile Link */}
          <Link href="/dashboard/profile">
            <motion.div 
              className="flex items-center px-3 py-3 hover:bg-white/70 rounded-lg mx-2 cursor-pointer transition-colors"
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/80 flex items-center justify-center bg-white/80 shadow-sm">
                {isMounted ? (
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "w-8 h-8",
                        userButtonTrigger: "w-8 h-8 rounded-full"
                      }
                    }} 
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                )}
              </div>
              <div className="hidden md:block ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userEmail?.split('@')[0] || t('common.member')}
                </p>
                <p className="text-xs text-gray-500">
                  {t('sidebar.viewProfile')}
                </p>
              </div>
            </motion.div>
          </Link>
        </div>
      </div>
  );
} 
