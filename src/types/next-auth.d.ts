import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    isDemo?: boolean;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      isDemo?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isDemo?: boolean;
  }
}
