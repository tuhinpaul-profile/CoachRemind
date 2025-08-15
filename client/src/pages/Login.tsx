import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { GraduationCap, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    const success = await login(email, password);
    if (!success) {
      toast.error('Invalid email or password');
    } else {
      toast.success('Login successful!');
    }
  };

  const fillDemoCredentials = (role: 'admin' | 'teacher') => {
    if (role === 'admin') {
      setEmail('admin@excellencecoaching.com');
      setPassword('admin123');
    } else {
      setEmail('teacher@excellencecoaching.com');
      setPassword('teacher123');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-violet-500 rounded-xl flex items-center justify-center mx-auto">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Excellence Coaching</h1>
          <p className="text-muted-foreground">Student Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isLoading}
              data-testid="login-email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
                data-testid="login-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
            data-testid="login-submit"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Demo Accounts</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fillDemoCredentials('admin')}
              disabled={isLoading}
              data-testid="demo-admin"
            >
              Admin Demo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fillDemoCredentials('teacher')}
              disabled={isLoading}
              data-testid="demo-teacher"
            >
              Teacher Demo
            </Button>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          <p>Demo credentials are pre-filled for testing</p>
          <p className="mt-1">Admin: admin@excellencecoaching.com / admin123</p>
          <p>Teacher: teacher@excellencecoaching.com / teacher123</p>
        </div>
      </Card>
    </div>
  );
}