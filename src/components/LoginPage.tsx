"use client";

import { useState, useEffect } from "react";
import { useSolidAuth } from "@ldo/solid-react";
import { useRouter } from "next/navigation";

const PRESET_ISSUERS = [
  {
    label: "Solid Community",
    value: "https://solidcommunity.net/",
  },
  {
    label: "Inrupt",
    value: "https://login.inrupt.com",
  },
  {
    label: "Local CSS",
    value: "http://localhost:3000",
  },
];

export default function LoginPage() {
  const { session, login } = useSolidAuth();
  const router = useRouter();
  const [issuerInput, setIssuerInput] = useState<string>(
    process.env.NEXT_PUBLIC_OIDC_ISSUER || ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (session.isLoggedIn) {
      router.replace("/");
    }
  }, [session.isLoggedIn, router]);

  if (session.isLoggedIn) {
    return null;
  }

  const validateIssuerUrl = (url: string): boolean => {
    if (!url.trim()) {
      setError("Please enter a Solid Identity Provider URL");
      return false;
    }

    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        setError("URL must start with http:// or https://");
        return false;
      }
    } catch {
      setError("Please enter a valid URL");
      return false;
    }

    setError(null);
    return true;
  };

  const handleLogin = async () => {
    const trimmedIssuer = issuerInput.trim();
    if (!validateIssuerUrl(trimmedIssuer)) {
      return;
    }

    setIsLoading(true);
    try {
      await login(trimmedIssuer);
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-white">
      {/* Left side - Logo and branding */}
      <section className="hidden flex-1 items-center justify-center border-r border-gray-200 bg-purple-50 px-8 lg:flex">
        <div className="max-w-md text-center">
          <div className="mb-6">
            <svg
              className="w-24 h-24 mx-auto text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-4xl font-normal text-gray-900">Sign in</h1>
          <p className="text-base text-gray-600">
            to continue to Volunteer Profile Editor
          </p>
        </div>
      </section>

      {/* Right side - Login form */}
      <section className="flex w-full flex-1 items-center justify-center bg-white px-4 py-12 lg:w-auto lg:min-w-[450px]">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <header className="mb-8 lg:hidden flex flex-col items-center justify-center">
            <svg
              className="w-20 h-20 text-purple-600 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h1 className="mb-2 text-center text-3xl font-normal text-gray-900">
              Sign in
            </h1>
            <p className="text-center text-base text-gray-600">
              to continue to Volunteer Profile Editor
            </p>
          </header>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-6"
          >
            {/* Identity Provider Input */}
            <div>
              <label
                htmlFor="oidc-issuer"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Solid Identity Provider
              </label>
              <input
                id="oidc-issuer"
                type="text"
                value={issuerInput}
                onChange={(e) => {
                  setIssuerInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter your provider URL"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  error ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isLoading}
              />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>

            {/* Preset providers */}
            <div>
              <p className="text-sm text-gray-600 mb-3">Or select a provider:</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_ISSUERS.map((issuer) => (
                  <button
                    key={issuer.value}
                    type="button"
                    onClick={() => setIssuerInput(issuer.value)}
                    className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                      issuerInput === issuer.value
                        ? "bg-purple-100 border-purple-500 text-purple-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                    disabled={isLoading}
                  >
                    {issuer.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit button */}
            <div className="flex items-center justify-end pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Next"
                )}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
