/**
 * Calendar Week View Component
 * 
 * Weekly calendar with time slots:
 * - Hourly time grid
 * - Week navigation
 * - Event positioning by time
 * - Multi-day header
 * - Time slot selection
 * - Drag-and-drop placeholder
 * - Current time indicator
 * - Responsive layout
 * 
 * @module components/calendar/week-view
 */

"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  type?: "meeting" | "deadline" | "training" | "election" | "other";
  color?: string;
  allDay?: boolean;
  description?: string;
  location?: string;
}

interface WeekViewProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
  onAddEvent?: (date: Date) => void;
  initialDate?: Date;
  startHour?: number;
  endHour?: number;
}

export function WeekView({
  events,
  onEventClick,
  onTimeSlotClick,
  onAddEvent,
  initialDate = new Date(),
  startHour = 0,
  endHour = 24,
}: WeekViewProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filterType, setFilterType] = useState<string>("all");

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getWeekDays = (date: Date): Date[] => {
    const weekStart = getWeekStart(date);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const isToday = (date: Date): boolean => {
    return isSameDay(date, new Date());
  };

  const getEventsForDayAndHour = (date: Date, hour: number): CalendarEvent[] => {
    return events.filter((event) => {
      if (filterType !== "all" && event.type !== filterType) {
        return false;
      }

      const eventDate = new Date(event.startDate);
      if (!isSameDay(eventDate, date)) {
        return false;
      }

      if (event.allDay) {
        return hour === startHour;
      }

      const eventHour = eventDate.getHours();
      return eventHour === hour;
    });
  };

  const calculateEventPosition = (event: CalendarEvent, hour: number) => {
    if (event.allDay) {
      return { top: 0, height: 100 };
    }

    const startMinutes = event.startDate.getHours() * 60 + event.startDate.getMinutes();
    const endMinutes = event.endDate.getHours() * 60 + event.endDate.getMinutes();
    const hourStart = hour * 60;
    const hourEnd = (hour + 1) * 60;

    const top = Math.max(0, ((startMinutes - hourStart) / 60) * 100);
    const bottom = Math.min(100, ((hourEnd - endMinutes) / 60) * 100);
    const height = 100 - top - bottom;

    return { top, height };
  };

  const getCurrentTimePosition = () => {
    const minutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const dayStart = startHour * 60;
    const dayDuration = (endHour - startHour) * 60;
    return ((minutes - dayStart) / dayDuration) * 100;
  };

  const weekDays = getWeekDays(currentDate);
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];

  const formatWeekRange = () => {
    const start = weekStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const end = weekEnd.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${start} - ${end}`;
  };

  const eventTypeColors = {
    meeting: "bg-blue-500",
    deadline: "bg-red-500",
    training: "bg-green-500",
    election: "bg-purple-500",
    other: "bg-gray-500",
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <CardTitle>{formatWeekRange()}</CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={goToPreviousWeek}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
                <Button variant="ghost" size="sm" onClick={goToNextWeek}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="meeting">Meetings</SelectItem>
                  <SelectItem value="deadline">Deadlines</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="election">Elections</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              {onAddEvent && (
                <Button onClick={() => onAddEvent(currentDate)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Event
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[700px]">
            <div className="grid grid-cols-8 gap-px bg-border rounded-lg overflow-hidden">
              {/* Time column header */}
              <div className="bg-muted p-2 sticky top-0 z-10">
                <Clock className="w-4 h-4 mx-auto text-muted-foreground" />
              </div>

              {/* Day headers */}
              {weekDays.map((day, index) => (
                <div
                  key={index}
                  className={`bg-muted p-2 text-center sticky top-0 z-10 ${
                    isToday(day) ? "bg-primary text-primary-foreground" : ""
                  }`}
                >
                  <div className="text-xs font-semibold">
                    {daysOfWeek[day.getDay()]}
                  </div>
                  <div className="text-lg font-bold">{day.getDate()}</div>
                  <div className="text-xs">
                    {day.toLocaleDateString("en-US", { month: "short" })}
                  </div>
                </div>
              ))}

              {/* Time slots */}
              {hours.map((hour) => (
                <React.Fragment key={hour}>
                  {/* Time label */}
                  <div className="bg-background p-2 text-right text-xs text-muted-foreground border-r">
                    {hour === 0
                      ? "12 AM"
                      : hour < 12
                      ? `${hour} AM`
                      : hour === 12
                      ? "12 PM"
                      : `${hour - 12} PM`}
                  </div>

                  {/* Day columns */}
                  {weekDays.map((day, dayIndex) => {
                    const dayEvents = getEventsForDayAndHour(day, hour);
                    const isCurrentHour =
                      isToday(day) &&
                      currentTime.getHours() === hour;

                    return (
                      <div
                        key={dayIndex}
                        onClick={() => onTimeSlotClick?.(day, hour)}
                        className="bg-background min-h-[60px] relative hover:bg-muted/50 cursor-pointer transition-colors group"
                      >
                        {/* Current time indicator */}
                        {isCurrentHour && (
                          <div
                            className="absolute left-0 right-0 border-t-2 border-red-500 z-20"
                            style={{ top: `${getCurrentTimePosition()}%` }}
                          >
                            <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
                          </div>
                        )}

                        {/* Events */}
                        {dayEvents.map((event) => {
                          const { top, height } = calculateEventPosition(
                            event,
                            hour
                          );

                          return (
                            <Popover key={event.id}>
                              <PopoverTrigger asChild>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEventClick?.(event);
                                  }}
                                  className={`absolute left-1 right-1 rounded p-1 text-xs text-white overflow-hidden ${
                                    event.color ||
                                    eventTypeColors[event.type || "other"]
                                  } hover:opacity-90 z-10`}
                                  style={{
                                    top: `${top}%`,
                                    height: `${height}%`,
                                  }}
                                >
                                  <div className="font-medium truncate">
                                    {event.title}
                                  </div>
                                  {!event.allDay && (
                                    <div className="text-[10px] opacity-90">
                                      {event.startDate.toLocaleTimeString("en-US", {
                                        hour: "numeric",
                                        minute: "2-digit",
                                      })}
                                    </div>
                                  )}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <EventDetails event={event} />
                              </PopoverContent>
                            </Popover>
                          );
                        })}

                        {/* Add event button on hover */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6"
                            onClick={() => {
                              const dateTime = new Date(day);
                              dateTime.setHours(hour, 0, 0, 0);
                              onAddEvent?.(dateTime);
                            }}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </ScrollArea>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
            {Object.entries(eventTypeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${color}`} />
                <span className="text-sm capitalize">{type}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Event Details Popover
function EventDetails({ event }: { event: CalendarEvent }) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-semibold">{event.title}</h4>
        {event.type && (
          <Badge variant="secondary" className="mt-1 capitalize">
            {event.type}
          </Badge>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">Start:</span>{" "}
          {formatDate(event.startDate)}
          {!event.allDay && ` at ${formatTime(event.startDate)}`}
        </div>
        <div>
          <span className="font-medium">End:</span> {formatDate(event.endDate)}
          {!event.allDay && ` at ${formatTime(event.endDate)}`}
        </div>
        {event.location && (
          <div>
            <span className="font-medium">Location:</span> {event.location}
          </div>
        )}
      </div>

      {event.description && (
        <div className="text-sm text-muted-foreground">{event.description}</div>
      )}
    </div>
  );
}

