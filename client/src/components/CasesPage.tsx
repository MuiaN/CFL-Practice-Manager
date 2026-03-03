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
import { useQuery } from "@tanstack/react-query";
import { type Case } from "@shared/schema";

export default function CasesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: cases = [], isLoading } = useQuery<Case[]>({
    queryKey: ["/api/cases"],
  });

  const { data: practiceAreas = [] } = useQuery<PracticeArea[]>({
    queryKey: ["/api/practice-areas"],
  });

  const filteredCases = cases.filter(c => 
    (statusFilter === "all" || c.status === statusFilter) &&
    (c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
            placeholder="Search cases..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Cases</TabsTrigger>
          <TabsTrigger value="my">My Cases</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1,2,3,4].map(i => <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : filteredCases.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCases.map((caseItem) => (
                <CaseCard
                  key={caseItem.id}
                  id={caseItem.id}
                  caseNumber={caseItem.caseNumber}
                  title={caseItem.title}
                  practiceArea={caseItem.practiceArea as any}
                  customPracticeAreaId={caseItem.customPracticeAreaId}
                  status={caseItem.status as any}
                  lastUpdated="Recently"
                  assignedTo={[]}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
              No cases found matching your criteria
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
