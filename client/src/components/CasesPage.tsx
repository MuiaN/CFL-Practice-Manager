import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CaseCard from "./CaseCard";
import { Plus, Search, Filter, LayoutGrid, List } from "lucide-react";

export default function CasesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
    {
      caseNumber: "CFL-2024-0025",
      title: "Debt Recovery Litigation",
      practiceArea: "Dispute Resolution" as const,
      status: "Active" as const,
      assignedTo: [
        { name: "Grace Muthoni", initials: "GM" },
        { name: "James Kipchoge", initials: "JK" },
      ],
      lastUpdated: "1 week ago",
    },
    {
      caseNumber: "CFL-2024-0018",
      title: "Data Privacy Compliance Review",
      practiceArea: "TMT" as const,
      status: "Closed" as const,
      assignedTo: [{ name: "Patricia Akinyi", initials: "PA" }],
      lastUpdated: "2 weeks ago",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cases</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all legal cases
          </p>
        </div>
        <Button data-testid="button-new-case">
          <Plus className="h-4 w-4 mr-2" />
          New Case
        </Button>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cases by number, title, or client..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-cases"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" data-testid="select-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="review">Under Review</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" data-testid="button-filter">
          <Filter className="h-4 w-4 mr-2" />
          More Filters
        </Button>
        <div className="flex border rounded-md">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="rounded-r-none"
            onClick={() => setViewMode("grid")}
            data-testid="button-view-grid"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="rounded-l-none"
            onClick={() => setViewMode("list")}
            data-testid="button-view-list"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">All Cases</TabsTrigger>
          <TabsTrigger value="my" data-testid="tab-my">My Cases</TabsTrigger>
          <TabsTrigger value="team" data-testid="tab-team">Team Cases</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <div className={viewMode === "grid" ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-4"}>
            {mockCases.map((caseItem, index) => (
              <CaseCard
                key={index}
                {...caseItem}
                onClick={() => console.log("Case clicked:", caseItem.caseNumber)}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="my">
          <div className="text-center py-12 text-muted-foreground">
            My assigned cases would appear here
          </div>
        </TabsContent>
        <TabsContent value="team">
          <div className="text-center py-12 text-muted-foreground">
            Team cases would appear here
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
