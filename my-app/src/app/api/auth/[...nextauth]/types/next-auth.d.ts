import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      email: string;
      role: string;
    };
  }

  interface User {
    id: string;
    username: string;
    email: string;
    role: string;
  }
}

declare global {
  interface Window {
    GA_INITIALIZED?: boolean;
    gtag?: (...args: any[]) => void;
  }
}
