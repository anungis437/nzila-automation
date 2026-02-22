"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Calendar, Users, CheckCircle } from "lucide-react";

interface StrategicGoal {
  id: string;
  title: string;
  description: string;
  category: "membership" | "financial" | "advocacy" | "operations";
  progress: number;
  dueDate: string;
  owner: string;
  status: "on-track" | "at-risk" | "delayed" | "completed";
}

interface StrategicPlanningBoardProps {
  goals?: StrategicGoal[];
}

export default function StrategicPlanningBoard({ goals }: StrategicPlanningBoardProps) {
  // Mock data
  const defaultGoals: StrategicGoal[] = [
    {
      id: "1",
      title: "Increase Membership by 15%",
      description: "Target 200 new members through organizing campaigns",
      category: "membership",
      progress: 45,
      dueDate: "2026-12-31",
      owner: "Organizing Committee",
      status: "on-track"
    },
    {
      id: "2",
      title: "Improve Grievance Resolution Time",
      description: "Reduce average resolution time from 45 to 30 days",
      category: "operations",
      progress: 30,
      dueDate: "2026-06-30",
      owner: "Chief Steward",
      status: "at-risk"
    },
    {
      id: "3",
      title: "Build Strike Fund to $500K",
      description: "Increase member contributions and fundraising",
      category: "financial",
      progress: 75,
      dueDate: "2026-09-30",
      owner: "Secretary-Treasurer",
      status: "on-track"
    },
    {
      id: "4",
      title: "Launch Member Portal",
      description: "Digital platform for member services and communications",
      category: "operations",
      progress: 90,
      dueDate: "2026-03-31",
      owner: "Technology Committee",
      status: "on-track"
    }
  ];

  const activeGoals = goals || defaultGoals;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "membership": return <Users className="h-4 w-4" />;
      case "financial": return <Target className="h-4 w-4" />;
      case "operations": return <CheckCircle className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on-track": return "bg-green-500/10 text-green-700 border-green-500/20";
      case "at-risk": return "bg-amber-500/10 text-amber-700 border-amber-500/20";
      case "delayed": return "bg-red-500/10 text-red-700 border-red-500/20";
      case "completed": return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      default: return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Strategic Planning Board
        </CardTitle>
        <CardDescription>
          Track progress on organizational goals and initiatives
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeGoals.map((goal) => (
            <Card key={goal.id} className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(goal.category)}
                      <CardTitle className="text-base">{goal.title}</CardTitle>
                    </div>
                    <CardDescription className="text-sm">
                      {goal.description}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(goal.status)}
                  >
                    {goal.status.replace("-", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                </div>

                {/* Meta Information */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{goal.owner}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
