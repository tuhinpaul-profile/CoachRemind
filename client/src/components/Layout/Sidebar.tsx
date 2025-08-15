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
  GraduationCap
} from "lucide-react";

const navigationItems = [
  { path: "/", label: "Dashboard Overview", icon: LayoutDashboard },
  { path: "/students", label: "Student Management", icon: Users },
  { path: "/attendance", label: "Attendance Management", icon: ClipboardCheck },
  { path: "/fees", label: "Fee Management", icon: DollarSign },
  { path: "/reports", label: "Reports & Analytics", icon: BarChart3 },
  { path: "/notifications", label: "Automated Notifications", icon: Bell },
  { path: "/chatbot", label: "Admin Chatbot", icon: MessageSquare },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 sidebar-transition">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-violet-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Excellence Coaching</h1>
            <p className="text-sm text-gray-500">Student Management System</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6 px-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <li key={item.path}>
                <Link href={item.path}>
                  <a 
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    data-testid={`nav-${item.path.replace('/', '') || 'dashboard'}`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
