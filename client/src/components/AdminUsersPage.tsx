import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, MoreVertical, Shield, Briefcase, UserX, Edit2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type User, type Role, type PracticeArea } from "@shared/schema";
import firmConfig from "@/lib/firmConfig";

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("password123");
  const [newUserRole, setNewUserRole] = useState("associate");
  const [newUserCustomRole, setNewUserCustomRole] = useState("");

  const [newUserPracticeAreas, setNewUserPracticeAreas] = useState<string[]>([]);
  const [newUserCustomPracticeAreas, setNewUserCustomPracticeAreas] = useState<string[]>([]);

  const { data: users = [] } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: roles = [] } = useQuery<Role[]>({ queryKey: ["/api/roles"] });
  const { data: practiceAreas = [] } = useQuery<PracticeArea[]>({ queryKey: ["/api/practice-areas"] });
  const { data: currentUser } = useQuery<User>({ queryKey: ["/api/auth/me"] });

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsCreateUserOpen(false);
      toast({ title: "User created successfully" });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => apiRequest("PATCH", `/api/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditingUser(null);
      toast({ title: "User updated successfully" });
    }
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("PATCH", `/api/users/${id}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User deactivated successfully" });
    }
  });

  const handleCreateUser = () => {
    createUserMutation.mutate({
      name: newUserName,
      email: newUserEmail,
      password: newUserPassword,
      role: newUserRole,
      customRoleId: newUserCustomRole || null,
      practiceAreas: newUserPracticeAreas,
      customPracticeAreaIds: newUserCustomPracticeAreas,
    });
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    updateUserMutation.mutate({
      id: editingUser.id,
      data: {
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        customRoleId: newUserCustomRole || null,
        practiceAreas: newUserPracticeAreas,
        customPracticeAreaIds: newUserCustomPracticeAreas,
      }
    });
  };

  useEffect(() => {
    if (editingUser) {
      setNewUserName(editingUser.name);
      setNewUserEmail(editingUser.email);
      setNewUserRole(editingUser.role);
      setNewUserCustomRole(editingUser.customRoleId || "");
      setNewUserPracticeAreas(editingUser.practiceAreas || []);
      setNewUserCustomPracticeAreas(editingUser.customPracticeAreaIds || []);
    } else {
      setNewUserName("");
      setNewUserEmail("");
      setNewUserRole("associate");
      setNewUserCustomRole("");
      setNewUserPracticeAreas([]);
      setNewUserCustomPracticeAreas([]);
    }
  }, [editingUser]);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage law firm staff, accounts, and system access
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-user">
                <Plus className="h-4 w-4 mr-2" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder={`john@${firmConfig.emailDomain}`} />
                </div>
                <div className="space-y-2">
                  <Label>Default Password</Label>
                  <Input type="text" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>System Role</Label>
                  <Select value={newUserRole} onValueChange={setNewUserRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="senior_associate">Senior Associate</SelectItem>
                      <SelectItem value="associate">Associate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Organization Role</Label>
                  <Select value={newUserCustomRole} onValueChange={setNewUserCustomRole}>
                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Practice Areas (System)</Label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-10">
                    {["corporate_commercial", "intellectual_property", "real_estate", "banking_finance", "dispute_resolution", "tmt"].map(pa => (
                      <Badge 
                        key={pa} 
                        variant={newUserPracticeAreas.includes(pa) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setNewUserPracticeAreas(prev => 
                            prev.includes(pa) ? prev.filter(p => p !== pa) : [...prev, pa]
                          );
                        }}
                      >
                        {pa.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Custom Practice Areas</Label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-10">
                    {practiceAreas.map(pa => (
                      <Badge 
                        key={pa.id} 
                        variant={newUserCustomPracticeAreas.includes(pa.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setNewUserCustomPracticeAreas(prev => 
                            prev.includes(pa.id) ? prev.filter(p => p !== pa.id) : [...prev, pa.id]
                          );
                        }}
                      >
                        {pa.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>Create User</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>System Role</TableHead>
              <TableHead>Practice Areas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className={user.isActive === "false" ? "opacity-50" : ""}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{user.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.practiceAreas?.map((pa, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{pa.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}</Badge>
                    ))}
                    {user.customPracticeAreaIds?.map((id, i) => {
                      const pa = practiceAreas.find(p => p.id === id);
                      return pa ? <Badge key={`custom-${i}`} variant="default" className="text-[10px] bg-primary/10 text-primary border-primary/20">{pa.name}</Badge> : null;
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={user.isActive === "true" ? "bg-status-online/10 text-status-online" : "bg-status-busy/10 text-status-busy"}>
                    {user.isActive === "true" ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingUser(user)}>
                        <Edit2 className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive" 
                        onClick={() => deactivateUserMutation.mutate(user.id)}
                        disabled={deactivateUserMutation.isPending}
                      >
                        <UserX className="h-4 w-4 mr-2" /> Deactivate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingUser} onOpenChange={open => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={newUserName} onChange={e => setNewUserName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>System Role</Label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="senior_associate">Senior Associate</SelectItem>
                  <SelectItem value="associate">Associate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Organization Role</Label>
              <Select value={newUserCustomRole} onValueChange={setNewUserCustomRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Practice Areas (System)</Label>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-10">
                {["corporate_commercial", "intellectual_property", "real_estate", "banking_finance", "dispute_resolution", "tmt"].map(pa => (
                  <Badge 
                    key={pa} 
                    variant={newUserPracticeAreas.includes(pa) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setNewUserPracticeAreas(prev => 
                        prev.includes(pa) ? prev.filter(p => p !== pa) : [...prev, pa]
                      );
                    }}
                  >
                    {pa.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Custom Practice Areas</Label>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-10">
                {practiceAreas.map(pa => (
                  <Badge 
                    key={pa.id} 
                    variant={newUserCustomPracticeAreas.includes(pa.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setNewUserCustomPracticeAreas(prev => 
                        prev.includes(pa.id) ? prev.filter(p => p !== pa.id) : [...prev, pa.id]
                      );
                    }}
                  >
                    {pa.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateUser} disabled={updateUserMutation.isPending}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
