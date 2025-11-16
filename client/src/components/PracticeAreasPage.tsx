import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Trash2, Plus } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface PracticeArea {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

const practiceAreaFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

type PracticeAreaFormValues = z.infer<typeof practiceAreaFormSchema>;

export default function PracticeAreasPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPracticeArea, setEditingPracticeArea] = useState<PracticeArea | null>(null);
  const [deletingPracticeArea, setDeletingPracticeArea] = useState<PracticeArea | null>(null);

  const { data: practiceAreas, isLoading } = useQuery<PracticeArea[]>({
    queryKey: ["/api/practice-areas"],
  });

  const createForm = useForm<PracticeAreaFormValues>({
    resolver: zodResolver(practiceAreaFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const editForm = useForm<PracticeAreaFormValues>({
    resolver: zodResolver(practiceAreaFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PracticeAreaFormValues) => {
      return await apiRequest("POST", "/api/practice-areas", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practice-areas"] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Success",
        description: "Practice area created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create practice area",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PracticeAreaFormValues }) => {
      return await apiRequest("PATCH", `/api/practice-areas/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practice-areas"] });
      setEditingPracticeArea(null);
      editForm.reset();
      toast({
        title: "Success",
        description: "Practice area updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update practice area",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/practice-areas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practice-areas"] });
      setDeletingPracticeArea(null);
      toast({
        title: "Success",
        description: "Practice area deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete practice area",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (practiceArea: PracticeArea) => {
    setEditingPracticeArea(practiceArea);
    editForm.reset({
      name: practiceArea.name,
      description: practiceArea.description || "",
    });
  };

  const onCreateSubmit = (data: PracticeAreaFormValues) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: PracticeAreaFormValues) => {
    if (editingPracticeArea) {
      updateMutation.mutate({ id: editingPracticeArea.id, data });
    }
  };

  const handleDelete = (practiceArea: PracticeArea) => {
    setDeletingPracticeArea(practiceArea);
  };

  const confirmDelete = () => {
    if (deletingPracticeArea) {
      deleteMutation.mutate(deletingPracticeArea.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading practice areas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Practice Area Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage practice areas for legal services
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-practice-area">
              <Plus className="w-4 h-4 mr-2" />
              Create Practice Area
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-create-practice-area">
            <DialogHeader>
              <DialogTitle>Create New Practice Area</DialogTitle>
              <DialogDescription>
                Add a new practice area to the system
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Environmental Law" {...field} data-testid="input-practice-area-name" />
                      </FormControl>
                      <FormDescription>
                        The name of the practice area
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the practice area and its focus" 
                          {...field} 
                          data-testid="input-practice-area-description"
                        />
                      </FormControl>
                      <FormDescription>
                        Optional description of the practice area
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-submit-practice-area"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Practice Area"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Practice Areas</CardTitle>
          <CardDescription>
            All practice areas in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!practiceAreas || practiceAreas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No practice areas found. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {practiceAreas.map((practiceArea) => (
                  <TableRow key={practiceArea.id} data-testid={`row-practice-area-${practiceArea.id}`}>
                    <TableCell className="font-medium" data-testid={`text-practice-area-name-${practiceArea.id}`}>{practiceArea.name}</TableCell>
                    <TableCell data-testid={`text-practice-area-description-${practiceArea.id}`}>{practiceArea.description || "-"}</TableCell>
                    <TableCell>{new Date(practiceArea.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(practiceArea)}
                          data-testid={`button-edit-practice-area-${practiceArea.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(practiceArea)}
                          data-testid={`button-delete-practice-area-${practiceArea.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingPracticeArea} onOpenChange={(open) => !open && setEditingPracticeArea(null)}>
        <DialogContent data-testid="dialog-edit-practice-area">
          <DialogHeader>
            <DialogTitle>Edit Practice Area</DialogTitle>
            <DialogDescription>
              Update the practice area details
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-practice-area-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-edit-practice-area-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  data-testid="button-update-practice-area"
                >
                  {updateMutation.isPending ? "Updating..." : "Update Practice Area"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingPracticeArea} onOpenChange={(open) => !open && setDeletingPracticeArea(null)}>
        <AlertDialogContent data-testid="dialog-confirm-delete-practice-area">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the practice area "{deletingPracticeArea?.name}". Cases and users with this practice area will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
