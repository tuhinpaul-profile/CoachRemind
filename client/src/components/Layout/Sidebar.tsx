import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  DollarSign,
  BarChart3,
  Bell,
  MessageSquare,
  Settings,
  GraduationCap,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const navigationItems = [
  { path: "/", label: "Dashboard Overview", icon: LayoutDashboard, roles: ["admin", "teacher"] },
  { path: "/students", label: "Student Management", icon: Users, roles: ["admin", "teacher"] },
  { path: "/attendance", label: "Attendance Management", icon: ClipboardCheck, roles: ["admin", "teacher"] },
  { path: "/fees", label: "Fee Management", icon: DollarSign, roles: ["admin"] },
  { path: "/reports", label: "Reports & Analytics", icon: BarChart3, roles: ["admin"] },
  { path: "/notifications", label: "Notifications", icon: Bell, roles: ["admin"] },
  { path: "/chatbot", label: "AI Assistant", icon: MessageSquare, roles: ["admin", "teacher"] },
  { path: "/settings", label: "Settings", icon: Settings, roles: ["admin", "teacher"] },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const allowedItems = navigationItems.filter(item => 
    item.roles.includes(user?.role || "teacher")
  );

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-sidebar shadow-lg border-r border-sidebar-border transition-all duration-300`}>
      <div className={`${isCollapsed ? 'p-2' : 'p-6'} border-b border-sidebar-border`}>
        {isCollapsed ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="w-10 h-10 bg-violet-500 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <button
              onClick={toggleSidebar}
              className="p-1 hover:bg-muted/50 rounded-lg transition-colors"
              data-testid="sidebar-toggle"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-violet-500 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-sidebar-foreground">Excellence Coaching</h1>
                <p className="text-sm text-muted-foreground">Student Management System</p>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              className="p-1 hover:bg-muted/50 rounded-lg transition-colors"
              data-testid="sidebar-toggle"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
      
      <nav className="mt-6 px-2">
        <ul className="space-y-1">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <li key={item.path}>
                <Link href={item.path}>
                  <div 
                    className={`nav-link ${isActive ? 'active' : ''} ${isCollapsed ? 'flex justify-center px-2 py-3' : 'flex items-center px-4 py-3'}`}
                    data-testid={`nav-${item.path.replace('/', '') || 'dashboard'}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                    {!isCollapsed && <span className="truncate font-medium">{item.label}</span>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
