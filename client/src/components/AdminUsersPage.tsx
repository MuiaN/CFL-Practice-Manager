import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, MoreVertical, UserX, Edit2, ShieldCheck } from "lucide-react";
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
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);
  const [newUserCustomRole, setNewUserCustomRole] = useState("");
  const [newUserCustomPracticeAreas, setNewUserCustomPracticeAreas] = useState<string[]>([]);

  const { data: users = [] } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: roles = [] } = useQuery<Role[]>({ queryKey: ["/api/roles"] });
  const { data: practiceAreas = [] } = useQuery<PracticeArea[]>({ queryKey: ["/api/practice-areas"] });

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsCreateUserOpen(false);
      resetForm();
      toast({ title: "Staff member created successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to create staff member", description: err.message, variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      apiRequest("PATCH", `/api/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditingUser(null);
      toast({ title: "Staff member updated successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update staff member", description: err.message, variant: "destructive" });
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("PATCH", `/api/users/${id}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Staff member deactivated" });
    },
  });

  const resetForm = () => {
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPassword("password123");
    setNewUserIsAdmin(false);
    setNewUserCustomRole("");
    setNewUserCustomPracticeAreas([]);
  };

  const handleCreateUser = () => {
    createUserMutation.mutate({
      name: newUserName,
      email: newUserEmail,
      password: newUserPassword,
      role: newUserIsAdmin ? "admin" : "associate",
      customRoleId: newUserCustomRole || null,
      practiceAreas: [],
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
        role: newUserIsAdmin ? "admin" : "associate",
        customRoleId: newUserCustomRole || null,
        practiceAreas: [],
        customPracticeAreaIds: newUserCustomPracticeAreas,
      },
    });
  };

  useEffect(() => {
    if (editingUser) {
      setNewUserName(editingUser.name);
      setNewUserEmail(editingUser.email);
      setNewUserIsAdmin(editingUser.role === "admin");
      setNewUserCustomRole(editingUser.customRoleId || "");
      setNewUserCustomPracticeAreas(editingUser.customPracticeAreaIds || []);
    } else {
      resetForm();
    }
  }, [editingUser]);

  const togglePracticeArea = (id: string) => {
    setNewUserCustomPracticeAreas(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const filteredUsers = users.filter(
    u =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleName = (user: User) => {
    if (user.customRoleId) {
      const r = roles.find(r => r.id === user.customRoleId);
      if (r) return r.name;
    }
    if (user.role === "admin") return "Administrator";
    return null;
  };

  const UserForm = ({ isEdit }: { isEdit?: boolean }) => (
    <div className="space-y-5 py-4">
      <div className="space-y-2">
        <Label>Full Name</Label>
        <Input
          value={newUserName}
          onChange={e => setNewUserName(e.target.value)}
          placeholder="Jane Mwangi"
          data-testid="input-user-name"
        />
      </div>

      <div className="space-y-2">
        <Label>Email Address</Label>
        <Input
          type="email"
          value={newUserEmail}
          onChange={e => setNewUserEmail(e.target.value)}
          placeholder={`jane@${firmConfig.emailDomain}`}
          data-testid="input-user-email"
        />
      </div>

      {!isEdit && (
        <div className="space-y-2">
          <Label>Default Password</Label>
          <Input
            type="text"
            value={newUserPassword}
            onChange={e => setNewUserPassword(e.target.value)}
            data-testid="input-user-password"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Role</Label>
        {roles.length === 0 ? (
          <p className="text-sm text-muted-foreground py-1">
            No roles created yet. Add roles in the Roles section first.
          </p>
        ) : (
          <Select value={newUserCustomRole} onValueChange={setNewUserCustomRole}>
            <SelectTrigger data-testid="select-user-role">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map(r => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-2">
        <Label>Practice Areas</Label>
        {practiceAreas.length === 0 ? (
          <p className="text-sm text-muted-foreground py-1">
            No practice areas created yet. Add them in the Practice Areas section first.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-12">
            {practiceAreas.map(pa => (
              <Badge
                key={pa.id}
                variant={newUserCustomPracticeAreas.includes(pa.id) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => togglePracticeArea(pa.id)}
                data-testid={`badge-practice-area-${pa.id}`}
              >
                {pa.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between rounded-md border p-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            Administrator access
          </div>
          <p className="text-xs text-muted-foreground">
            Grants full access to manage staff, cases, and system settings.
          </p>
        </div>
        <Switch
          checked={newUserIsAdmin}
          onCheckedChange={setNewUserIsAdmin}
          data-testid="switch-admin-access"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage law firm staff, accounts, and system access
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Input
              placeholder="Search staff..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-56 pl-3"
              data-testid="input-search-users"
            />
          </div>

          <Dialog
            open={isCreateUserOpen}
            onOpenChange={open => {
              setIsCreateUserOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button data-testid="button-create-user">
                <Plus className="h-4 w-4 mr-2" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Staff Member</DialogTitle>
              </DialogHeader>
              <UserForm />
              <DialogFooter>
                <Button
                  onClick={handleCreateUser}
                  disabled={createUserMutation.isPending || !newUserName || !newUserEmail}
                  data-testid="button-confirm-create-user"
                >
                  {createUserMutation.isPending ? "Creating..." : "Create Staff Member"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Practice Areas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  {searchQuery ? "No staff members match your search." : "No staff members yet."}
                </TableCell>
              </TableRow>
            )}
            {filteredUsers.map(user => {
              const roleName = getRoleName(user);
              const userPAs = practiceAreas.filter(pa =>
                user.customPracticeAreaIds?.includes(pa.id)
              );

              return (
                <TableRow
                  key={user.id}
                  className={user.isActive === "false" ? "opacity-50" : ""}
                  data-testid={`row-user-${user.id}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medium">{user.name}</span>
                        {user.role === "admin" && (
                          <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-primary font-medium">
                            <ShieldCheck className="h-3 w-3" /> Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    {roleName ? (
                      <Badge variant="secondary">{roleName}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {userPAs.length === 0 ? (
                        <span className="text-sm text-muted-foreground">—</span>
                      ) : (
                        userPAs.map(pa => (
                          <Badge
                            key={pa.id}
                            variant="outline"
                            className="text-[10px]"
                            data-testid={`badge-user-pa-${pa.id}`}
                          >
                            {pa.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        user.isActive === "true"
                          ? "bg-status-online/10 text-status-online"
                          : "bg-status-busy/10 text-status-busy"
                      }
                    >
                      {user.isActive === "true" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-user-menu-${user.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
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
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Edit user dialog */}
      <Dialog open={!!editingUser} onOpenChange={open => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          <UserForm isEdit />
          <DialogFooter>
            <Button
              onClick={handleUpdateUser}
              disabled={updateUserMutation.isPending || !newUserName || !newUserEmail}
              data-testid="button-confirm-update-user"
            >
              {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
