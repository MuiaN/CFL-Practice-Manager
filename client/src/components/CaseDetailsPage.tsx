import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type Case, type Document, type User, type PracticeArea } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Users, Clock, Briefcase, Edit2, Check, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CaseDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [location] = useLocation();
  const { toast } = useToast();
  
  const queryParams = new URLSearchParams(location.split('?')[1]);
  const initialEditMode = queryParams.get('edit') === 'true';
  const initialTab = queryParams.get('tab') || 'documents';
  
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const { data: caseItem, isLoading: isLoadingCase } = useQuery<Case>({
    queryKey: [`/api/cases/${id}`],
  });

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("");

  useEffect(() => {
    if (caseItem) {
      setEditTitle(caseItem.title);
      setEditDescription(caseItem.description || "");
      setEditStatus(caseItem.status);
    }
  }, [caseItem]);

  const updateCaseMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("PATCH", `/api/cases/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cases/${id}`] });
      setIsEditing(false);
      toast({ title: "Case updated successfully" });
    }
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

  const handleSave = () => {
    updateCaseMutation.mutate({
      title: editTitle,
      description: editDescription,
      status: editStatus,
    });
  };

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
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm text-muted-foreground uppercase tracking-wider">{caseItem.caseNumber}</span>
            {!isEditing && (
              <Badge variant="outline" className={statusColors[caseItem.status]}>
                {caseItem.status.replace("_", " ")}
              </Badge>
            )}
          </div>
          {isEditing ? (
            <div className="space-y-4 max-w-2xl mt-4">
              <div className="space-y-2">
                <Label>Case Title</Label>
                <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="text-xl font-bold" />
              </div>
              <div className="flex gap-4">
                <div className="space-y-2 flex-1">
                  <Label>Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleSave} disabled={updateCaseMutation.isPending}>
                    <Check className="h-4 w-4 mr-2" /> Save
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-2" /> Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{caseItem.title}</h1>
                <p className="text-muted-foreground mt-1">{getPracticeAreaDisplay()}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-2" /> Edit Case
              </Button>
            </div>
          )}
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
              {isEditing ? (
                <Textarea 
                  value={editDescription} 
                  onChange={e => setEditDescription(e.target.value)} 
                  className="min-h-[150px] resize-none"
                  placeholder="Enter case description..."
                />
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {caseItem.description || "No description provided for this case."}
                </p>
              )}
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Case Files</CardTitle>
                  <Button size="sm"><FileText className="h-4 w-4 mr-2" /> Upload File</Button>
                </CardHeader>
                <CardContent className="p-0 border-t">
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
