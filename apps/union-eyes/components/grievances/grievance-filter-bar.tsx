/**
 * Grievance Filter Bar
 *
 * Saved views + dynamic filter controls for the steward queue.
 * Pre-built views: My Active, Overdue, Awaiting Employer, Ready for Escalation, Recently Updated.
 *
 * @module components/grievances/grievance-filter-bar
 */

"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Search,
  SlidersHorizontal,
  X,
  Bookmark,
  Clock,
  _AlertTriangle,
  InboxIcon,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────

export interface GrievanceFilters {
  search: string;
  status: string;
  priority: string;
  employer: string;
  steward: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  savedView: string;
}

export interface SavedView {
  id: string;
  label: string;
  icon: React.ElementType;
  filters: Partial<GrievanceFilters>;
}

export interface GrievanceFilterBarProps {
  filters: GrievanceFilters;
  onFilterChange: (filters: GrievanceFilters) => void;
  employers?: { id: string; name: string }[];
  stewards?: { id: string; name: string }[];
  resultCount?: number;
  className?: string;
}

// ─── Saved Views ──────────────────────────────────────────────

export const SAVED_VIEWS: SavedView[] = [
  {
    id: "my_active",
    label: "My Active Cases",
    icon: Bookmark,
    filters: { status: "active", steward: "__me__" },
  },
  {
    id: "overdue",
    label: "Overdue",
    icon: Clock,
    filters: { status: "overdue" },
  },
  {
    id: "awaiting_employer",
    label: "Awaiting Employer Response",
    icon: InboxIcon,
    filters: { status: "response_due" },
  },
  {
    id: "escalation_ready",
    label: "Ready for Escalation",
    icon: ArrowUpRight,
    filters: { status: "escalated" },
  },
  {
    id: "recently_updated",
    label: "Recently Updated",
    icon: RefreshCw,
    filters: {},
  },
];

// ─── Default Filters ──────────────────────────────────────────

export const DEFAULT_FILTERS: GrievanceFilters = {
  search: "",
  status: "",
  priority: "",
  employer: "",
  steward: "",
  dateFrom: undefined,
  dateTo: undefined,
  savedView: "",
};

// ─── Component ────────────────────────────────────────────────

export function GrievanceFilterBar({
  filters,
  onFilterChange,
  employers = [],
  stewards = [],
  resultCount,
  className,
}: GrievanceFilterBarProps) {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const update = (partial: Partial<GrievanceFilters>) => {
    onFilterChange({ ...filters, ...partial });
  };

  const clearAll = () => onFilterChange({ ...DEFAULT_FILTERS });

  const activeFilterCount = [
    filters.status,
    filters.priority,
    filters.employer,
    filters.steward,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  const handleViewClick = (view: SavedView) => {
    onFilterChange({
      ...DEFAULT_FILTERS,
      ...view.filters,
      savedView: view.id,
    });
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Saved Views Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {SAVED_VIEWS.map((view) => {
          const Icon = view.icon;
          const isActive = filters.savedView === view.id;
          return (
            <Button
              key={view.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewClick(view)}
              className="flex-shrink-0"
            >
              <Icon className="h-3.5 w-3.5 mr-1.5" />
              {view.label}
            </Button>
          );
        })}
      </div>

      {/* Search + Quick Filters Row */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by case number, member, or keyword…"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="pl-9"
          />
        </div>

        <Select value={filters.status} onValueChange={(v) => update({ status: v, savedView: "" })}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_statuses">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="filed">Filed</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="response_due">Response Due</SelectItem>
            <SelectItem value="response_received">Response Received</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="arbitration">Arbitration</SelectItem>
            <SelectItem value="settled">Settled</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.priority} onValueChange={(v) => update({ priority: v, savedView: "" })}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_priorities">All Priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(showAdvanced && "bg-accent")}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Advanced Filters (collapsible) */}
      {showAdvanced && (
        <div className="flex flex-wrap gap-2 bg-muted/30 rounded-md p-3">
          {employers.length > 0 && (
            <Select value={filters.employer} onValueChange={(v) => update({ employer: v, savedView: "" })}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Employer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_employers">All Employers</SelectItem>
                {employers.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {stewards.length > 0 && (
            <Select value={filters.steward} onValueChange={(v) => update({ steward: v, savedView: "" })}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Steward" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_stewards">All Stewards</SelectItem>
                {stewards.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                {filters.dateFrom ? format(filters.dateFrom, "MMM d") : "From date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarPicker
                mode="single"
                selected={filters.dateFrom}
                onSelect={(d) => update({ dateFrom: d ?? undefined, savedView: "" })}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                {filters.dateTo ? format(filters.dateTo, "MMM d") : "To date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarPicker
                mode="single"
                selected={filters.dateTo}
                onSelect={(d) => update({ dateTo: d ?? undefined, savedView: "" })}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Active filter chips + count */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="secondary">{activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active</Badge>
          {resultCount !== undefined && (
            <span className="text-muted-foreground">
              {resultCount} case{resultCount !== 1 ? "s" : ""} found
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={clearAll} className="ml-auto text-xs">
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
