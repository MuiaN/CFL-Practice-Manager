import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Clock, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CaseCardProps {
  caseNumber: string;
  title: string;
  practiceArea: string;
  status: "active" | "pending" | "review" | "completed" | "Active" | "Pending" | "Closed" | "Under Review";
  assignedTo: Array<{ name: string; initials: string; avatar?: string }>;
  lastUpdated: string;
  onClick?: () => void;
}

const practiceAreaColors: Record<string, string> = {
  "Corporate & Commercial": "bg-chart-1/10 text-chart-1 border-chart-1/20",
  "Intellectual Property": "bg-chart-2/10 text-chart-2 border-chart-2/20",
  "Real Estate": "bg-chart-3/10 text-chart-3 border-chart-3/20",
  "Banking & Finance": "bg-chart-4/10 text-chart-4 border-chart-4/20",
  "Dispute Resolution": "bg-chart-5/10 text-chart-5 border-chart-5/20",
  TMT: "bg-primary/10 text-primary border-primary/20",
};

const statusColors: Record<string, string> = {
  Active: "bg-status-online/10 text-status-online border-status-online/20",
  Pending: "bg-status-away/10 text-status-away border-status-away/20",
  Closed: "bg-muted text-muted-foreground border-muted",
  "Under Review": "bg-status-busy/10 text-status-busy border-status-busy/20",
  active: "bg-status-online/10 text-status-online border-status-online/20",
  pending: "bg-status-away/10 text-status-away border-status-away/20",
  review: "bg-status-busy/10 text-status-busy border-status-busy/20",
  completed: "bg-muted text-muted-foreground border-muted",
};

export default function CaseCard({
  caseNumber,
  title,
  practiceArea,
  status,
  assignedTo,
  lastUpdated,
  onClick,
}: CaseCardProps) {
  const displayStatus = status.charAt(0).toUpperCase() + status.slice(1);
  
  return (
    <Card className="hover-elevate cursor-pointer" onClick={onClick} data-testid={`card-case-${caseNumber}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-sm text-muted-foreground mb-1">
            {caseNumber}
          </p>
          <h3 className="font-semibold leading-tight line-clamp-2">{title}</h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -mr-2"
              data-testid={`button-case-menu-${caseNumber}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem data-testid="menu-view">View Details</DropdownMenuItem>
            <DropdownMenuItem data-testid="menu-edit">Edit Case</DropdownMenuItem>
            <DropdownMenuItem data-testid="menu-assign">Reassign</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {practiceArea && (
            <Badge
              variant="outline"
              className={`border ${practiceAreaColors[practiceArea] || 'bg-muted text-muted-foreground'}`}
              data-testid="badge-practice-area"
            >
              {practiceArea}
            </Badge>
          )}
          <Badge
            variant="outline"
            className={`border ${statusColors[status.toLowerCase()]}`}
            data-testid="badge-status"
          >
            {displayStatus}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {assignedTo.slice(0, 3).map((person, idx) => (
              <Avatar key={idx} className="h-8 w-8 border-2 border-card">
                <AvatarImage src={person.avatar} />
                <AvatarFallback className="text-xs">{person.initials}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          {assignedTo.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{assignedTo.length - 3} more
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-4 border-t">
        <div className="flex items-center text-xs text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          Updated {lastUpdated}
        </div>
      </CardFooter>
    </Card>
  );
}
