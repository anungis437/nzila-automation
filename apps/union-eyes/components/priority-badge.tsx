import { Badge } from "@/components/ui/badge";

type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

interface PriorityBadgeProps {
  priority: string | Priority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const getPriorityColor = (priority: string | Priority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Badge className={getPriorityColor(priority)}>
      {priority}
    </Badge>
  );
}

