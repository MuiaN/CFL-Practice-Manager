import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { type Case, type Document, type User, type PracticeArea } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Users, Clock, Briefcase } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function CaseDetailsPage() {
  const { id } = useParams<{ id: string }>();
  
  const { data: caseItem, isLoading: isLoadingCase } = useQuery<Case>({
    queryKey: [`/api/cases/${id}`],
  });

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: [`/api/cases/${id}/documents`],
  });

  const { data: assignedUsers = [] } = useQuery<User[]>({
    queryKey: [`/api/cases/${id}/users`],
  });

  const { data: practiceAreas = [] } = useQuery<PracticeArea[]>({
    queryKey: ["/api/practice-areas"],
  });

  if (isLoadingCase) {
    return <div className="p-8 text-center">Loading case details...</div>;
  }

  if (!caseItem) {
    return <div className="p-8 text-center text-destructive">Case not found</div>;
  }

  const getPracticeAreaDisplay = () => {
    if (caseItem.customPracticeAreaId) {
      const pa = practiceAreas.find(p => p.id === caseItem.customPracticeAreaId);
      if (pa) return pa.name;
    }
    return caseItem.practiceArea.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  const statusColors: Record<string, string> = {
    active: "bg-status-online/10 text-status-online border-status-online/20",
    pending: "bg-status-away/10 text-status-away border-status-away/20",
    closed: "bg-muted text-muted-foreground border-muted",
    under_review: "bg-status-busy/10 text-status-busy border-status-busy/20",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm text-muted-foreground uppercase tracking-wider">{caseItem.caseNumber}</span>
            <Badge variant="outline" className={statusColors[caseItem.status]}>
              {caseItem.status.replace("_", " ")}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{caseItem.title}</h1>
          <p className="text-muted-foreground mt-1">{getPracticeAreaDisplay()}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Case Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {caseItem.description || "No description provided for this case."}
              </p>
            </CardContent>
          </Card>

          <Tabs defaultValue="documents" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents ({documents.length})
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assigned Team ({assignedUsers.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="documents" className="pt-4">
              <Card>
                <CardContent className="p-0">
                  {documents.length > 0 ? (
                    <div className="divide-y">
                      {documents.map((doc) => (
                        <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                              {doc.type}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">{doc.size} • Version {doc.version}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground italic">
                      No documents uploaded yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="team" className="pt-4">
              <Card>
                <CardContent className="p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {assignedUsers.map((user) => (
                      <div key={user.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{user.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <Badge variant="secondary" className="text-[10px] h-4 mt-0.5">
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative pl-6 pb-4 border-l border-muted last:border-0 last:pb-0">
                <div className="absolute left-[-5px] top-0 h-2 w-2 rounded-full bg-primary" />
                <p className="text-xs font-semibold uppercase text-muted-foreground">Case Updated</p>
                <p className="text-sm mt-1">Status changed to {caseItem.status.replace("_", " ")}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(caseItem.updatedAt).toLocaleString()}</p>
              </div>
              <div className="relative pl-6 pb-0 border-l border-muted last:border-0">
                <div className="absolute left-[-5px] top-0 h-2 w-2 rounded-full bg-muted" />
                <p className="text-xs font-semibold uppercase text-muted-foreground">Case Created</p>
                <p className="text-sm mt-1">Initial filing registered in the system</p>
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(caseItem.createdAt).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
