"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";

// A login revoked by a password reset/change comes back as a session with no
// user. Clear it and send the browser to the login page.
export default function SessionGuard() {
  const { data: session, status } = useSession();
  const signingOut = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || session?.user || signingOut.current) return;

    signingOut.current = true;
    toast.error("Your password was changed. Please sign in again.");
    void signOut({ callbackUrl: "/login" });
  }, [status, session]);

  return null;
}
