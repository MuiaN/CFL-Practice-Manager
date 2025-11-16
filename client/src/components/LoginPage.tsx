import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Scale } from "lucide-react";
import heroImage from "@assets/generated_images/Professional_law_office_Nairobi_6eaeab6d.png";
import { login } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: "Login successful",
        description: "Welcome to CFL Legal Practice Management System",
      });
      onLoginSuccess();
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden lg:flex lg:w-[60%] bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Professional law office"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
        </div>
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="h-10 w-10" />
              <div>
                <h1 className="text-4xl font-bold">CFL Legal</h1>
                <p className="text-sm text-white/80">Kilimani, Nairobi</p>
              </div>
            </div>
            <p className="text-lg text-white/90 max-w-md">
              Excellence in legal practice. Comprehensive solutions for Corporate,
              Intellectual Property, Real Estate, and more.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <Scale className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">CFL Legal</h1>
              <p className="text-sm text-muted-foreground">Kilimani, Nairobi</p>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground mt-2">
              Sign in to access your dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@cfllegal.co.ke"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                data-testid="input-password"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isLoading}
                  data-testid="checkbox-remember"
                />
                <Label
                  htmlFor="remember"
                  className="text-sm font-normal cursor-pointer"
                >
                  Remember me
                </Label>
              </div>
              <Button
                variant="ghost"
                className="px-0 text-sm h-auto text-primary hover:text-primary/80"
                type="button"
                disabled={isLoading}
                data-testid="link-forgot-password"
              >
                Forgot password?
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="space-y-2 text-center text-sm text-muted-foreground">
            <p>Demo credentials:</p>
            <p className="font-mono text-xs">
              Email: admin@cfllegal.co.ke | Password: admin123
            </p>
            <p className="text-xs">
              Authorized personnel only. Contact your administrator for access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
