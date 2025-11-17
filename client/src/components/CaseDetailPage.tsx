import { useState, type FormEvent } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Calendar,
  User,
  Briefcase,
  FileText,
  UserPlus,
  Edit,
  Upload,
  Download,
  X,
} from "lucide-react";
import type { Case, User as UserType, Document, PracticeArea } from "@shared/schema";

const statusColorMap = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  review: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  completed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const statusLabelMap = {
  active: "Active",
  pending: "Pending",
  review: "Under Review",
  completed: "Completed",
};

const updateCaseFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  clientName: z.string().min(1, "Client name is required"),
  practiceAreaId: z.string().uuid("Please select a practice area"),
  status: z.enum(["active", "pending", "review", "completed"]),
});

type UpdateCaseFormData = z.infer<typeof updateCaseFormSchema>;

export default function CaseDetailPage() {
  const [, params] = useRoute("/cases/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const caseId = params?.id;

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  const { data: caseData, isLoading: isCaseLoading } = useQuery<Case>({
    queryKey: ["/api/cases", caseId],
    enabled: !!caseId,
  });

  const { data: assignedUsers = [] } = useQuery<UserType[]>({
    queryKey: ["/api/cases", caseId, "users"],
    enabled: !!caseId,
  });

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/cases", caseId, "documents"],
    enabled: !!caseId,
  });

  const { data: allUsers = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const { data: practiceAreas = [] } = useQuery<PracticeArea[]>({
    queryKey: ["/api/practice-areas"],
  });

  const { data: currentUser } = useQuery<{ role: string }>({
    queryKey: ["/api/auth/me"],
  });

  const form = useForm<UpdateCaseFormData>({
    resolver: zodResolver(updateCaseFormSchema),
    defaultValues: {
      title: "",
      description: "",
      clientName: "",
      status: "active",
      practiceAreaId: "",
    },
  });

  const assignUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/cases/${caseId}/assign`, { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "users"] });
      toast({
        title: "User assigned",
        description: "User has been successfully assigned to the case",
      });
      setIsAssignDialogOpen(false);
      setSelectedUserId("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign user to case",
        variant: "destructive",
      });
    },
  });

  const updateCaseMutation = useMutation({
    mutationFn: async (updates: UpdateCaseFormData) => {
      return apiRequest("PATCH", `/api/cases/${caseId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      toast({
        title: "Case updated",
        description: "Case has been successfully updated",
      });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update case",
        variant: "destructive",
      });
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest("POST", "/api/documents", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "documents"] });
      toast({
        title: "Document uploaded",
        description: "Document has been successfully uploaded",
      });
      setIsUploadDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  const removeUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("DELETE", `/api/cases/${caseId}/users/${userId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "users"] });
      toast({
        title: "User removed",
        description: "User has been removed from the case",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove user from case",
        variant: "destructive",
      });
    },
  });

  const handleAssignUser = () => {
    if (selectedUserId) {
      assignUserMutation.mutate(selectedUserId);
    }
  };

  const handleUpdateCase = (data: UpdateCaseFormData) => {
    updateCaseMutation.mutate(data);
  };

  const handleFileUpload = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("caseId", caseId!);
    uploadDocumentMutation.mutate(formData);
  };

  const handleRemoveUser = (userId: string) => {
    removeUserMutation.mutate(userId);
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/documents/${doc.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!res.ok) {
        throw new Error("Failed to download document");
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = () => {
    if (caseData) {
      form.reset({
        title: caseData.title,
        description: caseData.description || "",
        clientName: caseData.clientName,
        status: caseData.status,
        practiceAreaId: caseData.practiceAreaId,
      });
      setIsEditDialogOpen(true);
    }
  };

  const practiceArea = practiceAreas.find(pa => pa.id === caseData?.practiceAreaId);
  const isAdmin = currentUser?.role === "admin";

  if (isCaseLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <p className="text-lg text-muted-foreground mb-4">Case not found</p>
        <Button onClick={() => setLocation("/cases")} data-testid="button-back-to-cases">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cases
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/cases")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{caseData.caseNumber}</h1>
              <Badge className={statusColorMap[caseData.status as keyof typeof statusColorMap]} data-testid="badge-case-status">
                {statusLabelMap[caseData.status as keyof typeof statusLabelMap]}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">{caseData.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Button variant="outline" onClick={openEditDialog} data-testid="button-edit-case">
                <Edit className="h-4 w-4 mr-2" />
                Edit Case
              </Button>
              <Button onClick={() => setIsAssignDialogOpen(true)} data-testid="button-assign-user">
                <UserPlus className="h-4 w-4 mr-2" />
                Assign User
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Name</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-client-name">{caseData.clientName}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Practice Area</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-practice-area">
              {practiceArea?.name || "Unknown"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-created-date">
              {new Date(caseData.createdAt).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="team" data-testid="tab-team">Team ({assignedUsers.length})</TabsTrigger>
          <TabsTrigger value="documents" data-testid="tab-documents">Documents ({documents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Case Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground" data-testid="text-description">
                {caseData.description || "No description provided"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Case Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm text-muted-foreground">Case Number</Label>
                  <p className="font-medium" data-testid="text-case-number">{caseData.caseNumber}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <p className="font-medium" data-testid="text-status">
                    {statusLabelMap[caseData.status as keyof typeof statusLabelMap]}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Client Name</Label>
                  <p className="font-medium" data-testid="text-client">{caseData.clientName}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Practice Area</Label>
                  <p className="font-medium" data-testid="text-area">{practiceArea?.name || "Unknown"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Created Date</Label>
                  <p className="font-medium" data-testid="text-created">
                    {new Date(caseData.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Last Updated</Label>
                  <p className="font-medium" data-testid="text-updated">
                    {new Date(caseData.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <div>
                <CardTitle>Assigned Team Members</CardTitle>
                <CardDescription>Users assigned to work on this case</CardDescription>
              </div>
              {isAdmin && (
                <Button onClick={() => setIsAssignDialogOpen(true)} data-testid="button-add-team-member">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {assignedUsers.length > 0 ? (
                <div className="space-y-4">
                  {assignedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-md border"
                      data-testid={`team-member-${user.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium" data-testid={`text-member-name-${user.id}`}>{user.name}</p>
                          <p className="text-sm text-muted-foreground" data-testid={`text-member-email-${user.id}`}>{user.email}</p>
                        </div>
                      </div>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveUser(user.id)}
                          disabled={removeUserMutation.isPending}
                          data-testid={`button-remove-member-${user.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No team members assigned yet</p>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setIsAssignDialogOpen(true)}
                      data-testid="button-assign-first-member"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assign First Member
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <div>
                <CardTitle>Case Documents</CardTitle>
                <CardDescription>Files and documents related to this case</CardDescription>
              </div>
              {isAdmin && (
                <Button onClick={() => setIsUploadDialogOpen(true)} data-testid="button-upload-document">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-md border"
                      data-testid={`document-${doc.id}`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate" data-testid={`text-doc-name-${doc.id}`}>{doc.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {doc.type} • {doc.size} • Version {doc.version}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDownloadDocument(doc)}
                        data-testid={`button-download-${doc.id}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No documents uploaded yet</p>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setIsUploadDialogOpen(true)}
                      data-testid="button-upload-first-document"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload First Document
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign User Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent data-testid="dialog-assign-user">
          <DialogHeader>
            <DialogTitle>Assign User to Case</DialogTitle>
            <DialogDescription>
              Select a user to assign to this case
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user">User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user" data-testid="select-user">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers
                    .filter(u => !assignedUsers.find(au => au.id === u.id))
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
              data-testid="button-cancel-assign"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignUser}
              disabled={!selectedUserId || assignUserMutation.isPending}
              data-testid="button-confirm-assign"
            >
              {assignUserMutation.isPending ? "Assigning..." : "Assign User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Case Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent data-testid="dialog-edit-case">
          <DialogHeader>
            <DialogTitle>Edit Case</DialogTitle>
            <DialogDescription>
              Update case information
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateCase)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Case Title</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-client" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="practiceAreaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Practice Area</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-practice-area">
                          <SelectValue placeholder="Select practice area" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {practiceAreas.map((pa) => (
                          <SelectItem key={pa.id} value={pa.id}>
                            {pa.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="review">Under Review</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} data-testid="textarea-edit-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateCaseMutation.isPending}
                  data-testid="button-save-edit"
                >
                  {updateCaseMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent data-testid="dialog-upload-document">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document for this case
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFileUpload} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">Select File</Label>
              <Input
                id="file"
                name="file"
                type="file"
                required
                data-testid="input-file"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUploadDialogOpen(false)}
                data-testid="button-cancel-upload"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploadDocumentMutation.isPending}
                data-testid="button-confirm-upload"
              >
                {uploadDocumentMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
