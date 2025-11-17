import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertCaseSchema, type PracticeArea } from "@shared/schema";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const caseFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  clientName: z.string().min(1, "Client name is required"),
  practiceAreaId: z.string().uuid("Please select a practice area"),
  status: z.enum(["active", "pending", "review", "completed"]).default("active"),
});

type CaseFormData = z.infer<typeof caseFormSchema>;

interface CreateCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCaseDialog({ open, onOpenChange }: CreateCaseDialogProps) {
  const { toast } = useToast();
  
  const { data: allPracticeAreas = [] } = useQuery<PracticeArea[]>({
    queryKey: ["/api/practice-areas"],
  });

  const { data: currentUser } = useQuery<{ role: string; practiceAreas: string[]; practiceAreaIds?: string[] }>({
    queryKey: ["/api/auth/me"],
  });

  // Filter practice areas based on user assignments
  // If admin, show all practice areas; otherwise, show only assigned ones
  const practiceAreas = currentUser?.role === "admin" 
    ? allPracticeAreas 
    : allPracticeAreas.filter(pa => 
        currentUser?.practiceAreas?.includes(pa.name)
      );

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<CaseFormData>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: {
      status: "active",
    },
  });

  const selectedPracticeAreaId = watch("practiceAreaId");
  const selectedStatus = watch("status");

  const createMutation = useMutation({
    mutationFn: async (data: CaseFormData) => {
      const result = await apiRequest("POST", "/api/cases", data);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Case created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create case",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CaseFormData) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" data-testid="dialog-create-case">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Create New Case</DialogTitle>
            <DialogDescription>
              Add a new case to the system. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Case Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Merger and Acquisition Agreement"
                {...register("title")}
                data-testid="input-title"
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                placeholder="e.g., Tech Startup Ltd"
                {...register("clientName")}
                data-testid="input-client-name"
              />
              {errors.clientName && (
                <p className="text-sm text-destructive">{errors.clientName.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="practiceAreaId">Practice Area *</Label>
              <Select
                value={selectedPracticeAreaId}
                onValueChange={(value) => setValue("practiceAreaId", value)}
              >
                <SelectTrigger id="practiceAreaId" data-testid="select-practice-area">
                  <SelectValue placeholder="Select practice area" />
                </SelectTrigger>
                <SelectContent>
                  {practiceAreas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.practiceAreaId && (
                <p className="text-sm text-destructive">{errors.practiceAreaId.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value: any) => setValue("status", value)}
              >
                <SelectTrigger id="status" data-testid="select-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="review">Under Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the case..."
                rows={4}
                {...register("description")}
                data-testid="textarea-description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              data-testid="button-create"
            >
              {createMutation.isPending ? "Creating..." : "Create Case"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
