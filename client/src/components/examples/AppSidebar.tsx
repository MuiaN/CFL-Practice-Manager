import AppSidebar from "../AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AppSidebarExample() {
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  const mockUser = {
    id: "1",
    email: "admin@cfllegal.co.ke",
    name: "John Mwangi",
    role: "admin" as const,
    practiceAreas: null,
    isActive: "true",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar user={mockUser} />
        <div className="flex-1 p-8 bg-background">
          <p className="text-muted-foreground">Main content area</p>
        </div>
      </div>
    </SidebarProvider>
  );
}
