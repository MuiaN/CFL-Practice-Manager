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
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Plus, Edit2, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Role } from "@shared/schema";

const MODULES = [
  { id: "cases", label: "Cases Module" },
  { id: "documents", label: "Documents Module" },
  { id: "admin", label: "Administration" },
  { id: "settings", label: "System Settings" },
];

export default function RoleManagementPage() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const { data: roles = [] } = useQuery<Role[]>({ queryKey: ["/api/roles"] });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/roles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: "Role created" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => apiRequest("PATCH", `/api/roles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setEditingRole(null);
      resetForm();
      toast({ title: "Role updated" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({ title: "Role deleted" });
    }
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setSelectedPermissions([]);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setName(role.name);
    setDescription(role.description || "");
    setSelectedPermissions(role.permissions || []);
  };

  const togglePermission = (moduleId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground mt-1">Configure user roles and module access permissions</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Create Role</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Role</DialogTitle></DialogHeader>
            <RoleForm 
              name={name} setName={setName} 
              description={description} setDescription={setDescription}
              selectedPermissions={selectedPermissions} togglePermission={togglePermission}
            />
            <DialogFooter>
              <Button onClick={() => createMutation.mutate({ name, description, permissions: selectedPermissions })}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map(role => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.name}</TableCell>
                <TableCell>{role.description}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions?.map(p => (
                      <span key={p} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">{p}</span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(role)}><Edit2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(role.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingRole} onOpenChange={open => !open && setEditingRole(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Role</DialogTitle></DialogHeader>
          <RoleForm 
            name={name} setName={setName} 
            description={description} setDescription={setDescription}
            selectedPermissions={selectedPermissions} togglePermission={togglePermission}
          />
          <DialogFooter>
            <Button onClick={() => updateMutation.mutate({ id: editingRole!.id, data: { name, description, permissions: selectedPermissions } })}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RoleForm({ name, setName, description, setDescription, selectedPermissions, togglePermission }: any) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Role Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Senior Partner" />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Role responsibilities" />
      </div>
      <div className="space-y-2">
        <Label>Module Access</Label>
        <div className="grid grid-cols-2 gap-4 pt-2">
          {MODULES.map(module => (
            <div key={module.id} className="flex items-center space-x-2">
              <Checkbox 
                id={module.id} 
                checked={selectedPermissions.includes(module.id)}
                onCheckedChange={() => togglePermission(module.id)}
              />
              <label htmlFor={module.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {module.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
