import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Upload,
  Search,
  Download,
  Eye,
  MoreVertical,
  Folder as FolderIcon,
  Plus,
  Edit2,
  Trash2,
  FolderOpen,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Document, Folder } from "@shared/schema";
import { format } from "date-fns";

type FolderWithCount = Folder & { documentCount: number };

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isEditFolderOpen, setIsEditFolderOpen] = useState(false);
  const [isDeleteFolderOpen, setIsDeleteFolderOpen] = useState(false);
  const [isUploadDocumentOpen, setIsUploadDocumentOpen] = useState(false);
  const [isDeleteDocumentOpen, setIsDeleteDocumentOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderWithCount | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: user } = useQuery<any>({ queryKey: ["/api/auth/me"] });
  const { data: folders = [], isLoading: foldersLoading } = useQuery<FolderWithCount[]>({
    queryKey: ["/api/folders"],
  });
  
  const { data: allDocuments = [], isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: user ? [`/api/users/${user.id}/documents`] : [],
    enabled: !!user,
  });

  const folderSchema = z.object({
    name: z.string().min(1, "Folder name is required"),
    description: z.string().optional(),
  });

  const uploadSchema = z.object({
    folderId: z.string().min(1, "Please select a folder"),
  });

  const createFolderForm = useForm<z.infer<typeof folderSchema>>({
    resolver: zodResolver(folderSchema),
    defaultValues: { name: "", description: "" },
  });

  const editFolderForm = useForm<z.infer<typeof folderSchema>>({
    resolver: zodResolver(folderSchema),
    defaultValues: { name: "", description: "" },
  });

  const uploadForm = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { folderId: "" },
  });

  const createFolderMutation = useMutation({
    mutationFn: async (data: z.infer<typeof folderSchema>) => {
      return await apiRequest("POST", "/api/folders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      setIsCreateFolderOpen(false);
      createFolderForm.reset();
      toast({ title: "Folder created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create folder", variant: "destructive" });
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: async (data: z.infer<typeof folderSchema>) => {
      return await apiRequest("PATCH", `/api/folders/${selectedFolder?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      setIsEditFolderOpen(false);
      setSelectedFolder(null);
      toast({ title: "Folder updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update folder", variant: "destructive" });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/folders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      setIsDeleteFolderOpen(false);
      setSelectedFolder(null);
      toast({ title: "Folder deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete folder",
        description: error.message || "The folder may contain documents",
        variant: "destructive",
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      if (user) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/documents`] });
      }
      setIsDeleteDocumentOpen(false);
      setSelectedDocument(null);
      toast({ title: "Document deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete document", variant: "destructive" });
    },
  });

  const handleCreateFolder = (data: z.infer<typeof folderSchema>) => {
    createFolderMutation.mutate(data);
  };

  const handleEditFolder = (data: z.infer<typeof folderSchema>) => {
    updateFolderMutation.mutate(data);
  };

  const handleDeleteFolder = () => {
    if (selectedFolder) {
      deleteFolderMutation.mutate(selectedFolder.id);
    }
  };

  const handleDeleteDocument = () => {
    if (selectedDocument) {
      deleteDocumentMutation.mutate(selectedDocument.id);
    }
  };

  const handleDownloadDocument = (doc: Document) => {
    window.open(`/api/documents/${doc.id}/download`, "_blank");
  };

  const handleUploadDocument = async (data: z.infer<typeof uploadSchema>) => {
    const fileInput = document.getElementById("file-upload") as HTMLInputElement;
    if (!fileInput?.files?.[0]) {
      toast({ title: "Please select a file", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("folderId", data.folderId);

    try {
      await apiRequest("POST", "/api/documents", formData);
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      if (user) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/documents`] });
      }
      setIsUploadDocumentOpen(false);
      uploadForm.reset();
      toast({ title: "Document uploaded successfully" });
    } catch (error) {
      toast({ title: "Failed to upload document", variant: "destructive" });
    }
  };

  const filteredDocuments = allDocuments.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">
            Manage case documents and files
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsCreateFolderOpen(true)}
            variant="outline"
            data-testid="button-create-folder"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button onClick={() => setIsUploadDocumentOpen(true)} data-testid="button-upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-documents"
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Folders</h2>
        {foldersLoading ? (
          <p className="text-muted-foreground">Loading folders...</p>
        ) : folders.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-4">
            {folders.map((folder) => (
              <Card
                key={folder.id}
                className="hover-elevate cursor-pointer"
                data-testid={`folder-${folder.id}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FolderIcon className="h-10 w-10 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{folder.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {folder.documentCount} files
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid={`button-folder-menu-${folder.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedFolder(folder);
                            editFolderForm.setValue("name", folder.name);
                            editFolderForm.setValue("description", folder.description || "");
                            setIsEditFolderOpen(true);
                          }}
                          data-testid={`menu-edit-folder-${folder.id}`}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedFolder(folder);
                            setIsDeleteFolderOpen(true);
                          }}
                          className="text-destructive"
                          data-testid={`menu-delete-folder-${folder.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">No folders yet</p>
              <Button onClick={() => setIsCreateFolderOpen(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create First Folder
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">All Documents</h2>
        {documentsLoading ? (
          <p className="text-muted-foreground">Loading documents...</p>
        ) : filteredDocuments.length > 0 ? (
          <div className="space-y-2">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="hover-elevate" data-testid={`document-${doc.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <FileText className="h-10 w-10 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                        <span>v{doc.version}</span>
                        <span>•</span>
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span className="text-xs">
                          {format(new Date(doc.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                      <Badge variant="secondary" data-testid={`badge-type-${doc.id}`}>
                        {doc.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadDocument(doc)}
                        data-testid={`button-view-${doc.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadDocument(doc)}
                        data-testid={`button-download-${doc.id}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-menu-${doc.id}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownloadDocument(doc)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadDocument(doc)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedDocument(doc);
                              setIsDeleteDocumentOpen(true);
                            }}
                            className="text-destructive"
                            data-testid={`menu-delete-${doc.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "No documents match your search" : "No documents yet"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsUploadDocumentOpen(true)} variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Document
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent data-testid="dialog-create-folder">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your documents
            </DialogDescription>
          </DialogHeader>
          <Form {...createFolderForm}>
            <form onSubmit={createFolderForm.handleSubmit(handleCreateFolder)} className="space-y-4">
              <FormField
                control={createFolderForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Folder Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Contracts" data-testid="input-folder-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createFolderForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Folder for contract documents"
                        data-testid="input-folder-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateFolderOpen(false)}
                  data-testid="button-cancel-create-folder"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createFolderMutation.isPending}
                  data-testid="button-submit-create-folder"
                >
                  {createFolderMutation.isPending ? "Creating..." : "Create Folder"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditFolderOpen} onOpenChange={setIsEditFolderOpen}>
        <DialogContent data-testid="dialog-edit-folder">
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>
              Update folder name and description
            </DialogDescription>
          </DialogHeader>
          <Form {...editFolderForm}>
            <form onSubmit={editFolderForm.handleSubmit(handleEditFolder)} className="space-y-4">
              <FormField
                control={editFolderForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Folder Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Contracts" data-testid="input-edit-folder-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editFolderForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Folder for contract documents"
                        data-testid="input-edit-folder-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditFolderOpen(false)}
                  data-testid="button-cancel-edit-folder"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateFolderMutation.isPending}
                  data-testid="button-submit-edit-folder"
                >
                  {updateFolderMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteFolderOpen} onOpenChange={setIsDeleteFolderOpen}>
        <DialogContent data-testid="dialog-delete-folder">
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedFolder?.name}"? This action cannot be undone.
              The folder must be empty before deletion.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteFolderOpen(false)}
              data-testid="button-cancel-delete-folder"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteFolder}
              disabled={deleteFolderMutation.isPending}
              data-testid="button-confirm-delete-folder"
            >
              {deleteFolderMutation.isPending ? "Deleting..." : "Delete Folder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadDocumentOpen} onOpenChange={setIsUploadDocumentOpen}>
        <DialogContent data-testid="dialog-upload-document">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a new document to a folder
            </DialogDescription>
          </DialogHeader>
          <Form {...uploadForm}>
            <form onSubmit={uploadForm.handleSubmit(handleUploadDocument)} className="space-y-4">
              <FormField
                control={uploadForm.control}
                name="folderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Folder</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-upload-folder">
                          <SelectValue placeholder="Select a folder" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>File</FormLabel>
                <FormControl>
                  <Input
                    id="file-upload"
                    type="file"
                    data-testid="input-file-upload"
                  />
                </FormControl>
              </FormItem>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUploadDocumentOpen(false)}
                  data-testid="button-cancel-upload"
                >
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-submit-upload">
                  Upload Document
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDocumentOpen} onOpenChange={setIsDeleteDocumentOpen}>
        <DialogContent data-testid="dialog-delete-document">
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedDocument?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDocumentOpen(false)}
              data-testid="button-cancel-delete-document"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDocument}
              disabled={deleteDocumentMutation.isPending}
              data-testid="button-confirm-delete-document"
            >
              {deleteDocumentMutation.isPending ? "Deleting..." : "Delete Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
