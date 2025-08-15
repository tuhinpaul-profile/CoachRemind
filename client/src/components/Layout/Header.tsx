import { Bell, Sun, Moon } from "lucide-react";
import { StorageService } from "@/lib/storage";
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  subtitle: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const [notificationCount, setNotificationCount] = useState(0);
  const { theme, toggleTheme } = useTheme();

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
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">Admin User</p>
              <p className="text-xs text-muted-foreground">Excellence Coaching</p>
            </div>
            <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">A</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
