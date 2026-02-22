/**
 * Empty State Component
 * 
 * Consistent placeholder UI for empty data states with:
 * - Customizable icon
 * - Title and description
 * - Call-to-action button
 * - Variants for different contexts
 * 
 * @module components/ui/empty-state
 */

"use client";

import * as React from "react";
import { LucideIcon, Inbox, Search, FileQuestion, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "search" | "error" | "info";
  className?: string;
  children?: React.ReactNode;
}

const variantConfig = {
  default: {
    icon: Inbox,
    iconColor: "text-gray-400",
    titleColor: "text-gray-900",
    descriptionColor: "text-gray-600",
  },
  search: {
    icon: Search,
    iconColor: "text-blue-400",
    titleColor: "text-gray-900",
    descriptionColor: "text-gray-600",
  },
  error: {
    icon: AlertCircle,
    iconColor: "text-red-400",
    titleColor: "text-gray-900",
    descriptionColor: "text-gray-600",
  },
  info: {
    icon: FileQuestion,
    iconColor: "text-blue-400",
    titleColor: "text-gray-900",
    descriptionColor: "text-gray-600",
  },
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default",
  className,
  children,
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = icon || config.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4",
          variant === "error" && "bg-red-50",
          variant === "search" && "bg-blue-50",
          variant === "info" && "bg-blue-50"
        )}
      >
        <Icon className={cn("h-8 w-8", config.iconColor)} />
      </div>
      
      <h3 className={cn("text-lg font-semibold mb-2", config.titleColor)}>
        {title}
      </h3>
      
      {description && (
        <p className={cn("text-sm max-w-md mb-6", config.descriptionColor)}>
          {description}
        </p>
      )}
      
      {action && (
        <Button onClick={action.onClick} variant={variant === "error" ? "destructive" : "default"}>
          {action.label}
        </Button>
      )}
      
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

