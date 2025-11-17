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
import { Card, CardContent } from "@/components/ui/card";
import CaseCard from "./CaseCard";
import { CreateCaseDialog } from "./CreateCaseDialog";
import { Plus, Search, Filter, LayoutGrid, List, Briefcase } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Case } from "@shared/schema";
import { useLocation } from "wouter";

export default function CasesPage() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: cases = [], isLoading } = useQuery<Case[]>({
    queryKey: ["/api/cases"],
  });

  const { data: user } = useQuery<{ id: string }>({
    queryKey: ["/api/auth/me"],
  });

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = 
      caseItem.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (caseItem.clientName && caseItem.clientName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || caseItem.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const myCases = filteredCases.filter(c => c.createdById === user?.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cases</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all legal cases
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-new-case">
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
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
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
          <TabsTrigger value="all" data-testid="tab-all">All Cases ({filteredCases.length})</TabsTrigger>
          <TabsTrigger value="my" data-testid="tab-my">My Cases ({myCases.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className={viewMode === "grid" ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-4"}>
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-48 animate-pulse bg-muted" />
              ))}
            </div>
          ) : filteredCases.length > 0 ? (
            <div className={viewMode === "grid" ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-4"}>
              {filteredCases.map((caseItem) => (
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
                  <p className="text-lg font-medium mb-1">No cases found</p>
                  <p className="text-sm mb-4">
                    {searchQuery || statusFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Create your first case to get started"}
                  </p>
                  {!searchQuery && statusFilter === "all" && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Case
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="my" className="space-y-4">
          {isLoading ? (
            <div className={viewMode === "grid" ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-4"}>
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-48 animate-pulse bg-muted" />
              ))}
            </div>
          ) : myCases.length > 0 ? (
            <div className={viewMode === "grid" ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-4"}>
              {myCases.map((caseItem) => (
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
                  <p className="text-lg font-medium mb-1">No cases assigned to you</p>
                  <p className="text-sm">Cases you create will appear here</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <CreateCaseDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
