import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Library from "./pages/Library";
import LessonExperience from "./pages/LessonExperience";
import BoostExperience from "./pages/BoostExperience";
import JourneyDetail from "./pages/JourneyDetail";
import Streak from "./pages/Streak";
import Progress from "./pages/Progress";
import Me from "./pages/Me";
import Signals from "./pages/Signals";
import SignalDetail from "./pages/SignalDetail";
import ReviewScreen from "./pages/ReviewScreen";
import { initAnalytics } from "@/lib/analytics";

function AnalyticsBootstrap() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return null;
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-bg">
        <div className="w-6 h-6 rounded-full border-2 border-border border-t-accent animate-spin" />
      </div>
    );
  }

  if (authError) {
    if (authError.type === "user_not_registered") return <UserNotRegisteredError />;
    if (authError.type === "auth_required") {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/"                   element={<Home />} />
        <Route path="/library"            element={<Library />} />
        <Route path="/journey/:slug"      element={<JourneyDetail />} />
        <Route path="/lesson/:id"         element={<LessonExperience />} />
        <Route path="/boost/:id"          element={<BoostExperience />} />
        <Route path="/review/:boostId"    element={<ReviewScreen />} />
        <Route path="/streak"             element={<Streak />} />
        <Route path="/progress"           element={<Progress />} />
        <Route path="/signals"            element={<Signals />} />
        <Route path="/signals/:slug"      element={<SignalDetail />} />
        <Route path="/me"                 element={<Me />} />
        <Route path="*"                   element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <AnalyticsBootstrap />
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}
