"use client";

import AuthWrapper from "@/components/AuthWrapper";
import ProfileEditor from "@/components/ProfileEditor";

/**
 * This is the home page.
 * It is available (by default) at http://localhost:3000/
 */
export default function HomePage() {
  return (
    <AuthWrapper>
      <ProfileEditor />
    </AuthWrapper>
  );
}
