"use client";

import { Suspense } from "react";
import AuthWrapper from "@/components/AuthWrapper";
import OpportunitySearch from "@/components/OpportunitySearch";
import { LoadingState } from "@/components/ui";

function OpportunitySearchWrapper() {
  return (
    <Suspense fallback={<LoadingState message="Loading search..." />}>
      <OpportunitySearch />
    </Suspense>
  );
}

function SearchPageContent() {
  return (
    <AuthWrapper>
      <OpportunitySearchWrapper />
    </AuthWrapper>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingState fullScreen message="Loading..." />}>
      <SearchPageContent />
    </Suspense>
  );
}
