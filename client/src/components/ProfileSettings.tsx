import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Lock, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const profileFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileFormSchema>;
type PasswordFormData = z.infer<typeof passwordFormSchema>;

export default function ProfileSettings() {
  const { toast } = useToast();
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery<{
    id: string;
    name: string;
    email: string;
    role: string;
    practiceAreas: string[];
  }>({
    queryKey: ["/api/auth/me"],
  });

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    values: user ? { name: user.name, email: user.email } : undefined,
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordFormSchema),
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return await apiRequest("PATCH", "/api/auth/me", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      return await apiRequest("PATCH", "/api/auth/me", {
        password: data.newPassword,
        currentPassword: data.currentPassword,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      resetPassword();
      setIsChangingPassword(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

  const onSubmitProfile = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onSubmitPassword = (data: PasswordFormData) => {
    updatePasswordMutation.mutate(data);
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: "Administrator",
      lawyer: "Lawyer",
      paralegal: "Paralegal",
      client: "Client",
    };
    return roleMap[role] || role;
  };

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-profile">
          Profile Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account information and password
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Update your personal details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                {...registerProfile("name")}
                data-testid="input-name"
              />
              {profileErrors.name && (
                <p className="text-sm text-destructive">{profileErrors.name.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  {...registerProfile("email")}
                  data-testid="input-email"
                  className="flex-1"
                />
              </div>
              {profileErrors.email && (
                <p className="text-sm text-destructive">{profileErrors.email.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Role</Label>
              <Input
                value={getRoleDisplay(user?.role || "")}
                disabled
                className="bg-muted"
                data-testid="input-role"
              />
            </div>

            {user?.practiceAreas && user.practiceAreas.length > 0 && (
              <div className="grid gap-2">
                <Label>Practice Areas</Label>
                <div className="flex flex-wrap gap-2">
                  {user.practiceAreas.map((area, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-md text-sm"
                      data-testid={`badge-practice-area-${index}`}
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                data-testid="button-save-profile"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isChangingPassword ? (
            <Button
              variant="outline"
              onClick={() => setIsChangingPassword(true)}
              data-testid="button-change-password"
            >
              Change Password
            </Button>
          ) : (
            <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...registerPassword("currentPassword")}
                  data-testid="input-current-password"
                />
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-destructive">
                    {passwordErrors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...registerPassword("newPassword")}
                  data-testid="input-new-password"
                />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-destructive">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...registerPassword("confirmPassword")}
                  data-testid="input-confirm-password"
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsChangingPassword(false);
                    resetPassword();
                  }}
                  data-testid="button-cancel-password"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updatePasswordMutation.isPending}
                  data-testid="button-save-password"
                >
                  {updatePasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
