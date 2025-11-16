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
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="relative hidden lg:flex lg:w-1/2 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-cyan-600/20 animate-pulse" />
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Professional law office"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-transparent" />
        </div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-center p-16 text-white">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-2xl shadow-blue-500/20">
                <Scale className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  CFL Legal
                </h1>
                <p className="text-sm text-blue-200/80 mt-1">Kilimani, Nairobi</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-2xl font-semibold text-white/90 leading-relaxed">
                Excellence in Legal Practice
              </p>
              <p className="text-base text-blue-100/70 max-w-lg leading-relaxed">
                Comprehensive solutions for Corporate, Intellectual Property, 
                Real Estate, Banking & Finance, and Dispute Resolution.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" />
              <div className="h-1 w-12 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full" />
              <div className="h-1 w-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-950/20 via-transparent to-purple-950/20" />
        
        <div className="w-full max-w-md relative z-10">
          <div className="flex lg:hidden items-center gap-3 mb-12">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Scale className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">CFL Legal</h1>
              <p className="text-sm text-blue-200/60">Kilimani, Nairobi</p>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl shadow-blue-500/5">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
              <p className="text-blue-200/60">
                Sign in to access your dashboard
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/90">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@cfllegal.co.ke"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  data-testid="input-email"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-blue-500/50 focus:ring-blue-500/20 h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/90">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  data-testid="input-password"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-blue-500/50 focus:ring-blue-500/20 h-12"
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
                    className="border-white/20 data-[state=checked]:bg-blue-600"
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm font-normal cursor-pointer text-white/70"
                  >
                    Remember me
                  </Label>
                </div>
                <Button
                  variant="ghost"
                  className="px-0 text-sm h-auto text-blue-400 hover:text-blue-300"
                  type="button"
                  disabled={isLoading}
                  data-testid="link-forgot-password"
                >
                  Forgot password?
                </Button>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/20 transition-all"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="mt-8 space-y-3 text-center">
              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <p className="text-sm text-blue-200/60">Demo credentials</p>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <p className="font-mono text-xs text-blue-100">
                  admin@cfllegal.co.ke
                </p>
                <p className="font-mono text-xs text-blue-100 mt-1">
                  admin123
                </p>
              </div>
              <p className="text-xs text-white/40 pt-2">
                Authorized personnel only
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
