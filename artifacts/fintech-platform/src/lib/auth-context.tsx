import { useState, createContext, useContext, ReactNode } from "react";
import { User, setAuthTokenGetter, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function initToken(): string | null {
  const t = localStorage.getItem("nova_session");
  setAuthTokenGetter(() => t);
  return t;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(initToken);
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: !!token,
      retry: false,
    }
  });

  const login = (newToken: string) => {
    localStorage.setItem("nova_session", newToken);
    setAuthTokenGetter(() => newToken);
    setToken(newToken);
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
  };

  const logout = () => {
    localStorage.removeItem("nova_session");
    setAuthTokenGetter(() => null);
    setToken(null);
    queryClient.setQueryData(getGetMeQueryKey(), null);
  };

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading: isLoading && !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
