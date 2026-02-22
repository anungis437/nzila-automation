"use client";

import * as React from "react";
import { CookieConsentBanner } from "@/components/gdpr/cookie-consent-banner";
import { useOrganizationId } from "@/contexts/organization-context";

export function CookieConsentProvider() {
  const organizationId = useOrganizationId();

  if (!organizationId) {
    return null;
  }

  return <CookieConsentBanner organizationId={organizationId} />;
}
