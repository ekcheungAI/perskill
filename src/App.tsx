import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { BoardProvider } from "@/contexts/BoardContext";
import { ApiSettingsProvider } from "@/contexts/ApiSettingsContext";
import Home from "@/pages/Home";
import PersonaDetail from "@/pages/PersonaDetail";
import BoardList from "@/pages/BoardList";
import BoardCreate from "@/pages/BoardCreate";
import BoardSession from "@/pages/BoardSession";
import PersonaMatch from "@/pages/PersonaMatch";
import Settings from "@/pages/Settings";
/** Scrolls window to top on every route change */
function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);
  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/persona/:id" component={PersonaDetail} />
        <Route path="/boards" component={BoardList} />
        <Route path="/board/new" component={BoardCreate} />
        <Route path="/board/:id" component={BoardSession} />
        <Route path="/match" component={PersonaMatch} />
        <Route path="/settings" component={Settings} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <BoardProvider>
            <ApiSettingsProvider>
              <Toaster position="bottom-right" />
              <Router />
            </ApiSettingsProvider>
          </BoardProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
