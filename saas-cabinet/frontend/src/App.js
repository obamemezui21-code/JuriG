import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import PrivateRoute from "./routes/PrivateRoute";
import PermissionRoute from "./routes/PermissionRoute";
import AppShell from "./components/AppShell";
import ActionConfirmDialog from "./components/ActionConfirmDialog";
import ActionStatusToast from "./components/ActionStatusToast";
import AppPreloader from "./components/AppPreloader";
import RouteLoader from "./components/RouteLoader";
import ScrollTopButton from "./components/ScrollTopButton";
import SupportFloatingButton from "./components/SupportFloatingButton";
import GeminiChat from "./components/GeminiChat";
import { PERMISSIONS } from "./utils/permissions";
import "./styles/responsive.css";
import "./styles/mobile-responsive.css";
import "./styles/themeToggle.css";
import "./styles/geminiChat.css";

const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage"));
const ClientsPage = lazy(() => import("./pages/clients/ClientsPage"));
const UsersPage = lazy(() => import("./pages/users/UsersPage"));
const UserCategoriesPage = lazy(() => import("./pages/users/UserCategoriesPage"));
const OrganizationPage = lazy(() => import("./pages/organization/OrganizationPage"));
const ServicesPage = lazy(() => import("./pages/services/ServicesPage"));
const ProceduresPage = lazy(() => import("./pages/procedures/ProceduresPage"));
const AccountingPage = lazy(() => import("./pages/accounting/AccountingPage"));
const ReceiptsPage = lazy(() => import("./pages/accounting/ReceiptsPage"));
const ReportsPage = lazy(() => import("./pages/accounting/ReportsPage"));
const ChartsPage = lazy(() => import("./pages/accounting/ChartsPage"));
const LegalTemplatesModule = lazy(() => import("./modules/legal-templates/components/LegalTemplatesModule"));

const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <AppPreloader />;
  }

  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
};

const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <AppPreloader />;
  }

  return user ? <Navigate to="/dashboard" replace /> : children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />

      <Route element={<PrivateRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route element={<PermissionRoute requiredPermission={PERMISSIONS.MANAGE_CLIENTS} />}>
            <Route path="/clients" element={<ClientsPage />} />
          </Route>

          <Route element={<PermissionRoute requiredPermission={PERMISSIONS.MANAGE_USERS} />}>
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/categories" element={<UserCategoriesPage />} />
          </Route>

          <Route element={<PermissionRoute requiredPermission={PERMISSIONS.MANAGE_SERVICES} />}>
            <Route path="/services" element={<ServicesPage />} />
          </Route>

          <Route element={<PermissionRoute requiredPermission={PERMISSIONS.MANAGE_PROCEDURES} />}>
            <Route path="/procedures" element={<ProceduresPage />} />
          </Route>

          <Route element={<PermissionRoute requiredPermission={PERMISSIONS.MANAGE_INVOICES} />}>
            <Route path="/accounting" element={<AccountingPage />} />
            <Route path="/accounting/receipts" element={<ReceiptsPage />} />
            <Route path="/accounting/reports" element={<ReportsPage />} />
            <Route path="/accounting/charts" element={<ChartsPage />} />
          </Route>

          <Route element={<PermissionRoute requiredPermission={PERMISSIONS.MANAGE_ORGANIZATION} />}>
            <Route path="/organization" element={<OrganizationPage />} />
          </Route>

          <Route element={<PermissionRoute requiredPermission={PERMISSIONS.VIEW_LEGAL_TEMPLATES} />}>
            <Route path="/legal-templates" element={<LegalTemplatesModule />} />
          </Route>

          <Route path="/cases" element={<Navigate to="/clients" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<RouteLoader />}>
            <AppRoutes />
          </Suspense>
          <GeminiChat position="bottom-right" />
          <ActionConfirmDialog />
          <ActionStatusToast />
          <SupportFloatingButton />
          <ScrollTopButton />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
