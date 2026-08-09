import { create } from "zustand";
import api from "../services/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "SALES" | "WAREHOUSE" | "ACCOUNTS";
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<void>;

  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,

  token: localStorage.getItem("token"),

  isAuthenticated: Boolean(
    localStorage.getItem("token")
  ),

  login: async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const { token, user } = response.data.data;

    localStorage.setItem("token", token);

    set({
      token,
      user,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem("token");

    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },
}));