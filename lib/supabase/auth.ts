// lib/supabase/auth.ts
import { headers } from "next/headers";

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export async function getUserId(): Promise<string> {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");

  if (!userId) {
    throw new AuthError("User ID not found in request context");
  }

  return userId;
}
