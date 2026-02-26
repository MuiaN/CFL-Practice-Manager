import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CaseCard from "./CaseCard";
import {
  Briefcase,
  Clock,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { type Case, type User } from "@shared/schema";
import { Link } from "wouter";

export default function DashboardPage() {
  const { data: user } = useQuery<User>({ queryKey: ["/api/auth/me"] });
  const { data: cases = [] } = useQuery<Case[]>({ queryKey: ["/api/cases"] });

  const stats = [
    {
      title: "Active Cases",
      value: cases.filter(c => c.status === "active").length.toString(),
      icon: Briefcase,
      change: "Current count",
      color: "text-chart-1",
    },
    {
      title: "Under Review",
      value: cases.filter(c => c.status === "under_review").length.toString(),
      icon: Clock,
      change: "Pending review",
      color: "text-chart-5",
    },
    {
      title: "Pending",
      value: cases.filter(c => c.status === "pending").length.toString(),
      icon: Clock,
      change: "Not started",
      color: "text-chart-2",
    },
    {
      title: "Closed",
      value: cases.filter(c => c.status === "closed").length.toString(),
      icon: CheckCircle2,
      change: "Total completed",
      color: "text-status-online",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.name}. Here's what's happening with your cases.
          </p>
        </div>
        <Link href="/cases">
          <Button data-testid="button-new-case">
            <Plus className="h-4 w-4 mr-2" />
            New Case
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} data-testid={`stat-card-${index}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Cases</h2>
          <Link href="/cases">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>
        {cases.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cases.slice(0, 4).map((caseItem) => (
              <CaseCard
                key={caseItem.id}
                caseNumber={caseItem.caseNumber}
                title={caseItem.title}
                practiceArea={caseItem.practiceArea as any}
                status={caseItem.status as any}
                lastUpdated="Recently"
                assignedTo={[]}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
            No cases assigned to you yet.
          </div>
        )}
      </div>
    </div>
  );
}
