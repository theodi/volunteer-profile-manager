"use client";

import { useEffect, useState, Suspense } from "react";
import { useSolidAuth } from "@ldo/solid-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface AuthWrapperProps {
  children: React.ReactNode;
}

// Check if there's any indication of a session in storage
function hasSessionInStorage(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const keys = Object.keys(localStorage);
    return keys.some(
      (key) =>
        key.includes("solidClientAuthn") ||
        key.includes("solid-auth") ||
        key.includes("oidc") ||
        key.includes("session")
    );
  } catch {
    return false;
  }
}

function AuthWrapperContent({ children }: AuthWrapperProps) {
  const { session } = useSolidAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasSessionIndicator] = useState(() => hasSessionInStorage());
  const [wasLoggedIn, setWasLoggedIn] = useState(false);

  // Check if we're in the middle of an OAuth callback
  const isOAuthCallback = searchParams.has("code") || searchParams.has("state");
  const isLoginPage = pathname === "/login";
  const hasSessionData = !!(
    session.webId ||
    session.sessionId ||
    session.clientAppId
  );

  useEffect(() => {
    if (session.isLoggedIn) {
      setWasLoggedIn(true);
    }

    // If we're in an OAuth callback, keep checking until session is established
    if (isOAuthCallback) {
      setIsCheckingSession(true);

      if (session.isLoggedIn) {
        setIsCheckingSession(false);
        const redirectTimer = setTimeout(() => {
          if (typeof window !== "undefined") {
            window.location.href = "/";
          }
        }, 200);
        return () => clearTimeout(redirectTimer);
      } else {
        const maxWaitTimer = setTimeout(() => {
          setIsCheckingSession(false);
        }, 10000);
        return () => clearTimeout(maxWaitTimer);
      }
    }

    if (session.isLoggedIn) {
      setIsCheckingSession(false);
      if (isLoginPage) {
        router.replace("/");
      }
      return;
    }

    if (wasLoggedIn && !session.isLoggedIn) {
      setIsCheckingSession(false);
      if (!isLoginPage) {
        router.replace("/login");
      }
      return;
    }

    const shouldWaitForRestore = hasSessionData || hasSessionIndicator;
    const checkTimer = setTimeout(
      () => {
        setIsCheckingSession(false);

        if (!session.isLoggedIn && !isLoginPage && !isOAuthCallback) {
          router.replace("/login");
        }
      },
      shouldWaitForRestore ? 2000 : 200
    );

    return () => clearTimeout(checkTimer);
  }, [
    session.isLoggedIn,
    session.webId,
    session.sessionId,
    isOAuthCallback,
    hasSessionIndicator,
    hasSessionData,
    wasLoggedIn,
    isLoginPage,
    router,
  ]);

  if (isCheckingSession || isOAuthCallback) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isOAuthCallback && isLoginPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session.isLoggedIn && !isLoginPage) {
    return null;
  }

  if (session.isLoggedIn && isLoginPage) {
    return null;
  }

  return <>{children}</>;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthWrapperContent>{children}</AuthWrapperContent>
    </Suspense>
  );
}
