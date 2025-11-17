import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Users,
  Settings,
  Scale,
  LogOut,
  Shield,
  Folder,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout, type AuthUser } from "@/lib/auth";
import { Link, useLocation } from "wouter";

interface AppSidebarProps {
  user: AuthUser;
}

export default function AppSidebar({ user }: AppSidebarProps) {
  const [location] = useLocation();

  const mainItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Cases",
      url: "/cases",
      icon: Briefcase,
    },
    {
      title: "Documents",
      url: "/documents",
      icon: FileText,
    },
  ];

  const adminItems = [
    {
      title: "User Management",
      url: "/admin/users",
      icon: Users,
    },
    {
      title: "Roles",
      url: "/admin/roles",
      icon: Shield,
    },
    {
      title: "Practice Areas",
      url: "/admin/practice-areas",
      icon: Folder,
    },
    {
      title: "Settings",
      url: "/admin/settings",
      icon: Settings,
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

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
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <img src="/favicon.png" alt="CFL Legal" className="h-6 w-6" />
          <div>
            <h2 className="font-semibold text-base leading-tight pb-0.5">CFL Legal</h2>
            <p className="text-xs text-muted-foreground">Kilimani, Nairobi</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`nav-${item.title.toLowerCase()}`}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user.role?.toLowerCase() === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url} data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full hover-elevate rounded-md p-2" data-testid="button-user-menu">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left text-sm">
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {getRoleDisplay(user.role || "")}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild data-testid="menu-profile">
              <Link href="/profile">
                <User className="h-4 w-4 mr-2" />
                Profile Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} data-testid="menu-logout">
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
