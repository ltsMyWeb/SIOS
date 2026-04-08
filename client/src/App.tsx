import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "./pages/dashboard-live";
import ClassView from "./pages/class-live";
import StudentView from "./pages/student-live";
import TeacherConsole from "./pages/teacher-crm-live";
import PrincipalConsole from "./pages/principal-console-live";
import StudentPortal from "./pages/student-portal-live";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/teacher-crm">
        <Redirect to="/teacher-console" />
      </Route>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/teacher-console" component={TeacherConsole} />
      <Route path="/principal-console" component={PrincipalConsole} />
      <Route path="/student-portal" component={StudentPortal} />
      <Route path="/class/:classId" component={ClassView} />
      <Route path="/student/:studentId" component={StudentView} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
