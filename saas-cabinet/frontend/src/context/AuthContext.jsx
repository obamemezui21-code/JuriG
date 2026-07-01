import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api";
import { DEFAULT_THEME_KEY, resolveThemeKey } from "../theme/palettes";

export const TOKEN_STORAGE_KEY = "saas-cabinet-token";
export const THEME_STORAGE_KEY = "cabinet_theme";
export const ORG_LOGO_STORAGE_KEY = "cabinet_logo";
export const ORG_NAME_STORAGE_KEY = "cabinet_name";

const applyTheme = (themeKey) => {
  const resolvedTheme = resolveThemeKey(themeKey || DEFAULT_THEME_KEY);
  document.documentElement.setAttribute("data-theme", resolvedTheme);
  localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme);
};

const getStoredTheme = () => {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return resolveThemeKey(storedTheme || DEFAULT_THEME_KEY);
};

const persistOrganizationBrand = (organization) => {
  if (!organization) {
    return;
  }

  const orgName = organization.name || "";

  localStorage.removeItem(ORG_LOGO_STORAGE_KEY);

  if (orgName) {
    localStorage.setItem(ORG_NAME_STORAGE_KEY, orgName);
  } else {
    localStorage.removeItem(ORG_NAME_STORAGE_KEY);
  }
};

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || "");
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      if (!token) {
        console.log('No token, skipping loadSession');
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      console.log('Loading session with token:', token.substring(0, 20) + '...');
      try {
        const session = await api.me(token);
        console.log('Session loaded successfully:', session);

        if (!isMounted) {
          return;
        }

        setUser(session.user);
        setOrganization(session.organization);
      } catch (_error) {
        console.log('Session load failed:', _error.message);
        if (!isMounted) {
          return;
        }

        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken("");
        setUser(null);
        setOrganization(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    const themeKey = organization?.themeKey || organization?.theme_key || getStoredTheme();
    applyTheme(themeKey);
  }, [organization]);

  useEffect(() => {
    persistOrganizationBrand(organization);
  }, [organization]);

  const applySession = (session) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, session.token);
    setToken(session.token);
    setUser(session.user);
    setOrganization(session.organization);
  };

  const login = async ({ email, password }) => {
    console.log('Attempting login for', email);
    const session = await api.login({ email, password });
    console.log('Login success, session:', session);
    applySession(session);
    return session;
  };

  const register = async ({ orgName, name, email, password }) => {
    const session = await api.register({ orgName, name, email, password });
    applySession(session);
    return session;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken("");
    setUser(null);
    setOrganization(null);
    applyTheme(getStoredTheme());
  };

  const refreshSession = async () => {
    if (!token) {
      return null;
    }

    const session = await api.me(token);
    setUser(session.user);
    setOrganization(session.organization);
    return session;
  };

  const value = {
    token,
    user,
    organization,
    loading,
    login,
    register,
    logout,
    refreshSession,
    setOrganization,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth doit etre utilise a l'interieur de AuthProvider.");
  }

  return context;
};
