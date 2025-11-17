import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CaseCard from "./CaseCard";
import {
  Briefcase,
  FileText,
  Clock,
  CheckCircle2,
  Plus,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CreateCaseDialog } from "./CreateCaseDialog";
import type { Case } from "@shared/schema";
import { useLocation } from "wouter";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: cases = [], isLoading: casesLoading } = useQuery<Case[]>({
    queryKey: ["/api/cases"],
  });

  const { data: user } = useQuery<{ practiceAreas: string[]; role: string }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: documents = [] } = useQuery<any[]>({
    queryKey: ["/api/documents"],
    enabled: user?.role === "admin",
  });

  const activeCases = cases.filter(c => c.status === "active");
  const pendingCases = cases.filter(c => c.status === "pending");
  const completedCases = cases.filter(c => c.status === "completed");
  const recentCases = cases.slice(0, 4);

  const stats = [
    {
      title: "Active Cases",
      value: activeCases.length.toString(),
      icon: Briefcase,
      change: `${cases.length} total`,
      color: "text-chart-1",
    },
    {
      title: "Documents",
      value: documents.length.toString(),
      icon: FileText,
      change: "Across all cases",
      color: "text-chart-2",
    },
    {
      title: "Pending Cases",
      value: pendingCases.length.toString(),
      icon: Clock,
      change: "Awaiting action",
      color: "text-chart-5",
    },
    {
      title: "Completed",
      value: completedCases.length.toString(),
      icon: CheckCircle2,
      change: "Closed cases",
      color: "text-status-online",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back. Here's what's happening with your cases.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-new-case">
          <Plus className="h-4 w-4 mr-2" />
          New Case
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} data-testid={`stat-card-${index}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`stat-value-${index}`}>{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {user?.practiceAreas && user.practiceAreas.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">My Practice Areas</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.practiceAreas.map((area, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="px-3 py-1"
                data-testid={`badge-area-${index}`}
              >
                {area}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Cases</h2>
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/cases")}
            data-testid="button-view-all-cases"
          >
            View all
          </Button>
        </div>
        {casesLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="h-48 animate-pulse bg-muted" />
            ))}
          </div>
        ) : recentCases.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recentCases.map((caseItem) => (
              <CaseCard
                key={caseItem.id}
                caseNumber={caseItem.caseNumber}
                title={caseItem.title}
                practiceArea=""
                status={caseItem.status as any}
                assignedTo={[]}
                lastUpdated={new Date(caseItem.createdAt).toLocaleDateString()}
                onClick={() => setLocation(`/cases/${caseItem.id}`)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-1">No cases yet</p>
                <p className="text-sm mb-4">Create your first case to get started</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Case
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <CreateCaseDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
