import { Bell, Sun, Moon, LogOut, User } from "lucide-react";
import { StorageService } from "@/lib/storage";
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface HeaderProps {
  title: string;
  subtitle: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const [notificationCount, setNotificationCount] = useState(0);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  useEffect(() => {
    const updateNotificationCount = () => {
      const notifications = StorageService.getNotifications();
      const unreadCount = notifications.filter(n => !n.read).length;
      setNotificationCount(unreadCount);
    };

    updateNotificationCount();
    
    // Update every 30 seconds
    const interval = setInterval(updateNotificationCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-background shadow-sm border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground" data-testid="page-title">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground" data-testid="page-subtitle">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
            data-testid="theme-toggle"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
          <div className="relative">
            <button 
              className="p-2 text-muted-foreground hover:text-foreground relative"
              data-testid="notification-button"
            >
              <Bell className="w-6 h-6" />
              {notificationCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                  data-testid="notification-badge"
                >
                  {notificationCount}
                </span>
              )}
            </button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-3 cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role} • Excellence Coaching</p>
                </div>
                <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">{user?.name.charAt(0)}</span>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={logout}
                className="flex items-center space-x-2 text-red-600 focus:text-red-600"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
