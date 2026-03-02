import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Clock, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useQuery } from "@tanstack/react-query";
import { type PracticeArea } from "@shared/schema";

interface CaseCardProps {
  caseNumber: string;
  title: string;
  practiceArea: string;
  customPracticeAreaId?: string | null;
  status: "active" | "pending" | "closed" | "under_review";
  assignedTo: Array<{ name: string; initials: string }>;
  lastUpdated: string;
  onClick?: () => void;
}

const statusColors: Record<string, string> = {
  active: "bg-status-online/10 text-status-online border-status-online/20",
  pending: "bg-status-away/10 text-status-away border-status-away/20",
  closed: "bg-muted text-muted-foreground border-muted",
  under_review: "bg-status-busy/10 text-status-busy border-status-busy/20",
};

export default function CaseCard({
  caseNumber,
  title,
  practiceArea,
  customPracticeAreaId,
  status,
  assignedTo,
  lastUpdated,
  onClick,
}: CaseCardProps) {
  const { data: practiceAreas = [] } = useQuery<PracticeArea[]>({ queryKey: ["/api/practice-areas"] });

  const getPracticeAreaDisplay = () => {
    if (customPracticeAreaId) {
      const pa = practiceAreas.find(p => p.id === customPracticeAreaId);
      if (pa) return pa.name;
    }
    return practiceArea.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  const statusLabel = status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <Card className="hover-elevate cursor-pointer h-full flex flex-col" onClick={onClick} data-testid={`card-case-${caseNumber}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs text-muted-foreground mb-1 uppercase tracking-wider">
            {caseNumber}
          </p>
          <h3 className="font-semibold leading-tight line-clamp-2 text-sm md:text-base">{title}</h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Edit Case</DropdownMenuItem>
            <DropdownMenuItem>Manage Files</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-[10px] font-medium">
            {getPracticeAreaDisplay()}
          </Badge>
          <Badge variant="outline" className={`text-[10px] font-medium border ${statusColors[status] || statusColors.pending}`}>
            {statusLabel}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {assignedTo && assignedTo.length > 0 ? (
              assignedTo.slice(0, 3).map((person, idx) => (
                <Avatar key={idx} className="h-6 w-6 border-2 border-card">
                  <AvatarFallback className="text-[8px]">{person.initials}</AvatarFallback>
                </Avatar>
              ))
            ) : (
              <span className="text-[10px] text-muted-foreground italic pl-2">Unassigned</span>
            )}
          </div>
          {assignedTo && assignedTo.length > 3 && (
            <span className="text-[10px] text-muted-foreground">
              +{assignedTo.length - 3} more
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-3 border-t bg-muted/30 mt-auto">
        <div className="flex items-center text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          {lastUpdated}
        </div>
      </CardFooter>
    </Card>
  );
}
