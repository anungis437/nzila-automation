"use client";

/**
 * Layout Wrapper component for Template App
 * Controls when to show the header based on the current URL path
 * Prevents header from appearing on dashboard pages
 */
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/header";

interface LayoutWrapperProps {
  children: ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  
  // Don&apos;t show header on dashboard or portal routes
  const isDashboardRoute = pathname.includes("/dashboard");
  const isPortalRoute = pathname.includes("/portal");
  
  return (
    <>
      {!isDashboardRoute && !isPortalRoute && <Header />}
      <main>
        {children}
      </main>
    </>
  );
} 
