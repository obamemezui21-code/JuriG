import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { ORG_LOGO_STORAGE_KEY, ORG_NAME_STORAGE_KEY, useAuth } from "../context/AuthContext";
import { hasPermission, PERMISSIONS } from "../utils/permissions";
import { defaultAppLogo } from "../assets/branding";
import { LEGAL_TEMPLATES_NAV_ITEM } from "../modules/legal-templates/config";

const getJurNavLinkClassName = ({ isActive }) => `jur-nav-link ${isActive ? "active" : ""}`;

const NAV_ICONS = {
  dashboard: (
    <svg viewBox="0 0 24 24" className="jur-nav-icon" aria-hidden="true">
      <path d="M4 13h7V4H4zm9 7h7V4h-7zM4 20h7v-5H4z" fill="currentColor" />
    </svg>
  ),
  organization: (
    <svg viewBox="0 0 24 24" className="jur-nav-icon" aria-hidden="true">
      <path d="M4 20V7l8-4 8 4v13M9 20v-5h6v5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  clients: (
    <svg viewBox="0 0 24 24" className="jur-nav-icon" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z" fill="currentColor" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" className="jur-nav-icon" aria-hidden="true">
      <path d="M9 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm6 1a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 15 12ZM3 20v-1c0-2.761 3.134-5 7-5s7 2.239 7 5v1M16.5 20v-1a4.7 4.7 0 0 0-2-3.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  services: (
    <svg viewBox="0 0 24 24" className="jur-nav-icon" aria-hidden="true">
      <path d="M6 7h12M6 12h12M6 17h8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  procedures: (
    <svg viewBox="0 0 24 24" className="jur-nav-icon" aria-hidden="true">
      <path d="M7 4h10l3 3v13H7z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 11h6M10 15h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  accounting: (
    <svg viewBox="0 0 24 24" className="jur-nav-icon" aria-hidden="true">
      <path d="M5 19V9m7 10V5m7 14v-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  legalTemplates: (
    <svg viewBox="0 0 24 24" className="jur-nav-icon" aria-hidden="true">
      <path d="M4 4h16v16H4z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 8h8m-8 4h8m-8 4h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
};

const AppShell = () => {
  const { user, organization, logout } = useAuth();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const orgName = organization?.name || "";

    localStorage.removeItem(ORG_LOGO_STORAGE_KEY);
    if (orgName) {
      localStorage.setItem(ORG_NAME_STORAGE_KEY, orgName);
    }
  }, [organization]);

  const canManageClients = hasPermission(user.permissions, PERMISSIONS.MANAGE_CLIENTS);
  const canManageUsers = hasPermission(user.permissions, PERMISSIONS.MANAGE_USERS);
  const canManageServices = hasPermission(user.permissions, PERMISSIONS.MANAGE_SERVICES);
  const canManageProcedures = hasPermission(user.permissions, PERMISSIONS.MANAGE_PROCEDURES);
  const canManageInvoices = hasPermission(user.permissions, PERMISSIONS.MANAGE_INVOICES);
  const canManageOrganization = hasPermission(user.permissions, PERMISSIONS.MANAGE_ORGANIZATION);
  const canViewLegalTemplates = hasPermission(user.permissions, PERMISSIONS.VIEW_LEGAL_TEMPLATES);

  const navItems = useMemo(
    () =>
      [
        { label: "Accueil", path: "/dashboard", icon: NAV_ICONS.dashboard },
        canManageOrganization ? { label: "Cabinet", path: "/organization", icon: NAV_ICONS.organization } : null,
        canManageClients ? { label: "Clients", path: "/clients", icon: NAV_ICONS.clients } : null,
        canManageUsers ? { label: "Utilisateurs", path: "/users", icon: NAV_ICONS.users } : null,
        canManageServices ? { label: "Services", path: "/services", icon: NAV_ICONS.services } : null,
        canManageProcedures ? { label: "Procedures", path: "/procedures", icon: NAV_ICONS.procedures } : null,
        canManageInvoices ? { label: "Comptabilite", path: "/accounting", icon: NAV_ICONS.accounting } : null,
        canManageInvoices ? { label: "Decaissements", path: "/accounting/receipts", icon: NAV_ICONS.accounting } : null,
        canManageInvoices ? { label: "Rapports", path: "/accounting/reports", icon: NAV_ICONS.accounting } : null,
        canManageInvoices ? { label: "Graphiques", path: "/accounting/charts", icon: NAV_ICONS.accounting } : null,
        canViewLegalTemplates ? { label: "Modèles Juridiques", path: "/legal-templates", icon: NAV_ICONS.legalTemplates } : null,
      ].filter(Boolean),
    [
      canManageClients,
      canManageInvoices,
      canManageOrganization,
      canManageProcedures,
      canManageServices,
      canManageUsers,
      canViewLegalTemplates,
    ]
  );

  const closeOverlays = () => {
    setNavOpen(false);
  };

  const closeNav = () => {
    setNavOpen(false);
  };

  const isOverlayOpen = navOpen;

  return (
    <div className="app-shell jur-layout">
      <aside className={`jur-sidebar ${navOpen ? "open" : ""}`}>
        <div className="jur-sidebar-head">
          <div className="jur-brand-mark">
            <img className="jur-logo" src={defaultAppLogo} alt="Logo JuriGabon" />
          </div>
          <div>
            <p className="jur-kicker">Plateforme</p>
            <p className="jur-title">{organization?.name || "Cabinet Juridique Pro"}</p>
          </div>
        </div>

        <nav className="jur-nav">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={getJurNavLinkClassName} onClick={closeNav}>
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="jur-profile">
          <div>
            <p className="jur-profile-name">{user.name || "Avocat"}</p>
            <p className="jur-profile-role">{user.role || "Administrateur"}</p>
          </div>
          <button type="button" className="btn btn-ghost sidebar-logout-btn" onClick={logout} aria-label="Sortir" title="Sortir">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M10 6V4a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 12H3m0 0 3-3m-3 3 3 3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </aside>

      <button type="button" className={`jur-backdrop ${isOverlayOpen ? "show" : ""}`} onClick={closeOverlays} aria-hidden={!isOverlayOpen} />

      <section className="app-main">
        <header className="mobile-app-bar">
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setNavOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={navOpen}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div className="mobile-app-brand">
            <span className="mobile-app-kicker">Plateforme</span>
            <strong>{organization?.name || "Cabinet Juridique Pro"}</strong>
          </div>
        </header>
        <main className="content-wrap page-transition" key={location.pathname}>
          <Outlet />
        </main>
      </section>
    </div>
  );
};

export default AppShell;
