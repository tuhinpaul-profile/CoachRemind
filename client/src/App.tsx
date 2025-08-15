import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Header } from "@/components/Layout/Header";
import { Dashboard } from "@/pages/Dashboard";
import { StudentManagement } from "@/pages/StudentManagement";
import { AttendanceManagement } from "@/pages/AttendanceManagement";
import { FeeManagement } from "@/pages/FeeManagement";
import { Reports } from "@/pages/Reports";
import { Notifications } from "@/pages/Notifications";
import { Chatbot } from "@/pages/Chatbot";
import { Settings } from "@/pages/Settings";
import { StorageService } from "@/lib/storage";
import { EmailService } from "@/lib/emailService";
import { initializeSampleData } from "@/lib/sampleData";
import { useToast, ToastContainer } from "@/hooks/useToast";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";

function Router() {
  const [pageTitle, setPageTitle] = useState("Dashboard Overview");
  const [pageSubtitle, setPageSubtitle] = useState("Monitor your coaching center's performance");

  const updatePageInfo = (path: string) => {
    const pageInfo = {
      "/": {
        title: "Dashboard Overview",
        subtitle: "Monitor your coaching center's performance"
      },
      "/students": {
        title: "Student Management",
        subtitle: "Add, edit, and manage student information"
      },
      "/attendance": {
        title: "Attendance Management",
        subtitle: "Track daily attendance and generate reports"
      },
      "/fees": {
        title: "Fee Management",
        subtitle: "Track fee payments and send reminders"
      },
      "/reports": {
        title: "Reports & Analytics",
        subtitle: "Generate comprehensive reports and analytics"
      },
      "/notifications": {
        title: "Automated Notifications",
        subtitle: "Configure and send automated notifications"
      },
      "/chatbot": {
        title: "Admin Chatbot",
        subtitle: "AI-powered assistant for student queries"
      },
      "/settings": {
        title: "Settings",
        subtitle: "Configure system settings and preferences"
      }
    };

    const info = pageInfo[path as keyof typeof pageInfo] || pageInfo["/"];
    setPageTitle(info.title);
    setPageSubtitle(info.subtitle);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={pageTitle} subtitle={pageSubtitle} />
        <main className="flex-1 overflow-y-auto p-6">
          <Switch>
            <Route path="/" component={() => {
              updatePageInfo("/");
              return <Dashboard />;
            }} />
            <Route path="/students" component={() => {
              updatePageInfo("/students");
              return <StudentManagement />;
            }} />
            <Route path="/attendance" component={() => {
              updatePageInfo("/attendance");
              return <AttendanceManagement />;
            }} />
            <Route path="/fees" component={() => {
              updatePageInfo("/fees");
              return <FeeManagement />;
            }} />
            <Route path="/reports" component={() => {
              updatePageInfo("/reports");
              return <Reports />;
            }} />
            <Route path="/notifications" component={() => {
              updatePageInfo("/notifications");
              return <Notifications />;
            }} />
            <Route path="/chatbot" component={() => {
              updatePageInfo("/chatbot");
              return <Chatbot />;
            }} />
            <Route path="/settings" component={() => {
              updatePageInfo("/settings");
              return <Settings />;
            }} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  const { toasts, removeToast } = useToast();

  useEffect(() => {
    // Initialize data if not present
    const students = StorageService.getStudents();
    if (students.length === 0) {
      initializeSampleData();
    }

    // Initialize email service
    EmailService.initialize();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <ProtectedRoute>
              <Router />
            </ProtectedRoute>
            <Toaster />
            <ToastContainer toasts={toasts} onRemove={removeToast} />
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
