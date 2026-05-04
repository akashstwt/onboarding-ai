import { DUMMY_USERS } from "./dummyData";

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface User {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  provider: "EMAIL" | "GOOGLE";
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

const AUTH_USERS_KEY = "dummy_users";
const AUTH_PASSWORDS_KEY = "dummy_user_passwords";
const AUTH_CURRENT_USER_ID_KEY = "currentUserId";

function makeToken(userId: string): string {
  return `local-${userId}-${Date.now()}`;
}

function ensureSeededAuthStorage() {
  if (typeof window === "undefined") return;

  const existingUsers = localStorage.getItem(AUTH_USERS_KEY);
  if (!existingUsers) {
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(DUMMY_USERS));
  }

  const existingPasswords = localStorage.getItem(AUTH_PASSWORDS_KEY);
  if (!existingPasswords) {
    const seededPasswords = DUMMY_USERS.reduce<Record<string, string>>(
      (acc, user) => {
        acc[user.email.toLowerCase()] = "password123";
        return acc;
      },
      {}
    );
    localStorage.setItem(AUTH_PASSWORDS_KEY, JSON.stringify(seededPasswords));
  }
}

function getStoredUsers(): User[] {
  if (typeof window === "undefined") return DUMMY_USERS;
  ensureSeededAuthStorage();
  const rawUsers = localStorage.getItem(AUTH_USERS_KEY);
  if (!rawUsers) return [...DUMMY_USERS];
  try {
    return JSON.parse(rawUsers) as User[];
  } catch {
    return [...DUMMY_USERS];
  }
}

function setStoredUsers(users: User[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function getStoredPasswords(): Record<string, string> {
  if (typeof window === "undefined") return {};
  ensureSeededAuthStorage();
  const rawPasswords = localStorage.getItem(AUTH_PASSWORDS_KEY);
  if (!rawPasswords) return {};
  try {
    return JSON.parse(rawPasswords) as Record<string, string>;
  } catch {
    return {};
  }
}

function setStoredPasswords(passwords: Record<string, string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_PASSWORDS_KEY, JSON.stringify(passwords));
}

function getCurrentUserFromStorage(): User | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("token");
  if (!token) return null;

  const currentUserId = localStorage.getItem(AUTH_CURRENT_USER_ID_KEY);
  const users = getStoredUsers();

  if (currentUserId) {
    return users.find((u) => u.id === currentUserId) || null;
  }

  if (token.startsWith("local-")) {
    const parts = token.split("-");
    const parsedUserId = parts.length >= 3 ? parts[1] : null;
    if (parsedUserId) {
      const user = users.find((u) => u.id === parsedUserId) || null;
      if (user) {
        localStorage.setItem(AUTH_CURRENT_USER_ID_KEY, user.id);
      }
      return user;
    }
  }

  return null;
}

function ok<T>(message: string, data: T): Promise<ApiResponse<T>> {
  return Promise.resolve({ success: true, message, data });
}

function fail(message: string): never {
  throw new Error(message);
}


export const authAPI = {
  signup: async (name: string, email: string, password: string) => {
    if (typeof window === "undefined") {
      return fail("Signup is only available in browser mode");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const users = getStoredUsers();
    const passwords = getStoredPasswords();

    const existingUser = users.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );
    if (existingUser) {
      return fail("An account with this email already exists");
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      name: name.trim() || null,
      email: normalizedEmail,
      role: "USER",
      provider: "EMAIL",
      createdAt: new Date().toISOString(),
    };

    users.unshift(newUser);
    passwords[normalizedEmail] = password;

    setStoredUsers(users);
    setStoredPasswords(passwords);

    const token = makeToken(newUser.id);
    localStorage.setItem(AUTH_CURRENT_USER_ID_KEY, newUser.id);

    return ok<AuthResponse>("Signup successful", { token, user: newUser });
  },

  login: async (email: string, password: string) => {
    if (typeof window === "undefined") {
      return fail("Login is only available in browser mode");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const users = getStoredUsers();
    const passwords = getStoredPasswords();

    const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      return fail("Invalid email or password");
    }

    const storedPassword = passwords[normalizedEmail];
    if (!storedPassword || storedPassword !== password) {
      return fail("Invalid email or password");
    }

    const token = makeToken(user.id);
    localStorage.setItem(AUTH_CURRENT_USER_ID_KEY, user.id);

    return ok<AuthResponse>("Login successful", { token, user });
  },

  googleLogin: async (_googleToken: string) => {
    const users = getStoredUsers();
    const fallbackUser = users.find((u) => u.role === "ADMIN") || users[0];

    if (!fallbackUser) {
      return fail("No users found for Google sign-in");
    }

    const token = makeToken(fallbackUser.id);
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_CURRENT_USER_ID_KEY, fallbackUser.id);
    }

    return ok<AuthResponse>("Google sign-in successful", {
      token,
      user: fallbackUser,
    });
  },

  getMe: async () => {
    const user = getCurrentUserFromStorage();
    if (!user) {
      return fail("Session expired. Please log in again.");
    }
    return ok<{ user: User }>("User profile loaded", { user });
  },
};

export const adminAPI = {
  getDashboard: async () =>
    ok("Dashboard loaded", {
      users: getStoredUsers().length,
      admins: getStoredUsers().filter((u) => u.role === "ADMIN").length,
    }),

  getUsers: async () => {
    const users = getStoredUsers();
    return ok<{ users: User[]; count: number }>("Users loaded", {
      users,
      count: users.length,
    });
  },

  updateUserRole: async (userId: string, role: "USER" | "ADMIN") => {
    const users = getStoredUsers();
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return fail("User not found");
    }

    users[userIndex] = { ...users[userIndex], role };
    setStoredUsers(users);

    const currentUserId =
      typeof window !== "undefined"
        ? localStorage.getItem(AUTH_CURRENT_USER_ID_KEY)
        : null;
    if (currentUserId === userId && typeof window !== "undefined") {
      localStorage.setItem("role", role);
    }

    return ok("User role updated", { user: users[userIndex] });
  },

  deleteUser: async (userId: string) => {
    const users = getStoredUsers();
    const targetUser = users.find((u) => u.id === userId);

    if (!targetUser) {
      return fail("User not found");
    }

    const nextUsers = users.filter((u) => u.id !== userId);
    setStoredUsers(nextUsers);

    const passwords = getStoredPasswords();
    delete passwords[targetUser.email.toLowerCase()];
    setStoredPasswords(passwords);

    return ok("User deleted", { deletedUserId: userId });
  },

  getSettings: async () => ok("Settings loaded", {}),
};


export const authHelpers = {
  saveAuth: (token: string, role: "USER" | "ADMIN", userId?: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    if (userId) {
      localStorage.setItem(AUTH_CURRENT_USER_ID_KEY, userId);
    }
  },

  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  },

  getRole: (): "USER" | "ADMIN" | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("role") as "USER" | "ADMIN" | null;
  },

  isAuthenticated: () => !!authHelpers.getToken(),
  isAdmin: () => authHelpers.getRole() === "ADMIN",

  logout: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem(AUTH_CURRENT_USER_ID_KEY);
    window.location.href = "/login";
  },
};