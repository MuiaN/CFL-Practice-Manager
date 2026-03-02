import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Briefcase, Plus, Edit2, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type PracticeArea } from "@shared/schema";

export default function PracticeAreaManagementPage() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPA, setEditingPA] = useState<PracticeArea | null>(null);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dashboardConfig, setDashboardConfig] = useState("");

  const { data: practiceAreas = [] } = useQuery<PracticeArea[]>({ queryKey: ["/api/practice-areas"] });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/practice-areas", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practice-areas"] });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: "Practice Area created" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => apiRequest("PATCH", `/api/practice-areas/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practice-areas"] });
      setEditingPA(null);
      resetForm();
      toast({ title: "Practice Area updated" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/practice-areas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practice-areas"] });
      toast({ title: "Practice Area deleted" });
    }
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setDashboardConfig("");
  };

  const handleEdit = (pa: PracticeArea) => {
    setEditingPA(pa);
    setName(pa.name);
    setDescription(pa.description || "");
    setDashboardConfig(pa.dashboardConfig || "");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Practice Areas</h1>
          <p className="text-muted-foreground mt-1">Manage firm specializations and dashboard visibility</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Create Area</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Practice Area</DialogTitle></DialogHeader>
            <PAForm 
              name={name} setName={setName} 
              description={description} setDescription={setDescription}
              config={dashboardConfig} setConfig={setDashboardConfig}
            />
            <DialogFooter>
              <Button onClick={() => createMutation.mutate({ name, description, dashboardConfig })}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Area Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Dashboard Widgets</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {practiceAreas.map(pa => (
              <TableRow key={pa.id}>
                <TableCell className="font-medium">{pa.name}</TableCell>
                <TableCell>{pa.description}</TableCell>
                <TableCell>{pa.dashboardConfig}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(pa)}><Edit2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(pa.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingPA} onOpenChange={open => !open && setEditingPA(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Practice Area</DialogTitle></DialogHeader>
          <PAForm 
            name={name} setName={setName} 
            description={description} setDescription={setDescription}
            config={dashboardConfig} setConfig={setDashboardConfig}
          />
          <DialogFooter>
            <Button onClick={() => updateMutation.mutate({ id: editingPA!.id, data: { name, description, dashboardConfig } })}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PAForm({ name, setName, description, setDescription, config, setConfig }: any) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Area Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Maritime Law" />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Area overview" />
      </div>
      <div className="space-y-2">
        <Label>Dashboard Configuration</Label>
        <Input value={config} onChange={e => setConfig(e.target.value)} placeholder="Comma-separated widgets (e.g. stats,recent_cases)" />
      </div>
    </div>
  );
}
