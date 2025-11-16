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
  Filter,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";

export default function DashboardPage() {
  const stats = [
    {
      title: "Active Cases",
      value: "12",
      icon: Briefcase,
      change: "+2 this week",
      color: "text-chart-1",
    },
    {
      title: "Documents",
      value: "48",
      icon: FileText,
      change: "+8 today",
      color: "text-chart-2",
    },
    {
      title: "Pending Tasks",
      value: "7",
      icon: Clock,
      change: "3 due today",
      color: "text-chart-5",
    },
    {
      title: "Completed",
      value: "23",
      icon: CheckCircle2,
      change: "This month",
      color: "text-status-online",
    },
  ];

  const mockCases = [
    {
      caseNumber: "CFL-2024-0042",
      title: "Merger and Acquisition Agreement for Tech Startup",
      practiceArea: "Corporate & Commercial" as const,
      status: "Active" as const,
      assignedTo: [
        { name: "Sarah Kimani", initials: "SK" },
        { name: "Peter Ochieng", initials: "PO" },
      ],
      lastUpdated: "2 hours ago",
    },
    {
      caseNumber: "CFL-2024-0038",
      title: "Trademark Registration for Fashion Brand",
      practiceArea: "Intellectual Property" as const,
      status: "Under Review" as const,
      assignedTo: [{ name: "Mary Wanjiru", initials: "MW" }],
      lastUpdated: "1 day ago",
    },
    {
      caseNumber: "CFL-2024-0035",
      title: "Commercial Property Lease Agreement - Westlands",
      practiceArea: "Real Estate" as const,
      status: "Active" as const,
      assignedTo: [
        { name: "John Mwangi", initials: "JM" },
        { name: "Alice Njeri", initials: "AN" },
        { name: "David Mutua", initials: "DM" },
      ],
      lastUpdated: "3 days ago",
    },
    {
      caseNumber: "CFL-2024-0029",
      title: "Loan Agreement Dispute Resolution",
      practiceArea: "Banking & Finance" as const,
      status: "Pending" as const,
      assignedTo: [{ name: "Robert Kariuki", initials: "RK" }],
      lastUpdated: "5 days ago",
    },
  ];

  const practiceAreas = [
    "Corporate & Commercial",
    "Intellectual Property",
    "Real Estate",
    "Banking & Finance",
    "Dispute Resolution",
    "TMT",
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, John. Here's what's happening with your cases.
          </p>
        </div>
        <Button data-testid="button-new-case">
          <Plus className="h-4 w-4 mr-2" />
          New Case
        </Button>
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
          <h2 className="text-xl font-semibold">My Practice Areas</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {practiceAreas.slice(0, 3).map((area, index) => (
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

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Cases</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cases..."
                className="pl-9 w-64"
                data-testid="input-search"
              />
            </div>
            <Button variant="outline" data-testid="button-filter">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mockCases.map((caseItem, index) => (
            <CaseCard
              key={index}
              {...caseItem}
              onClick={() => console.log("Case clicked:", caseItem.caseNumber)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
