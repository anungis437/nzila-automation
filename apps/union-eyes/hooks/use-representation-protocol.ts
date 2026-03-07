/**
 * useRepresentationProtocol
 *
 * Client-side hook that fetches and caches the per-org representation protocol.
 * Falls back to the steward-led preset while loading or on error.
 *
 * @module hooks/use-representation-protocol
 */

"use client";

import { useEffect, useState } from "react";
import { useOrg } from "@/lib/org-context";
import {
  type RepresentationProtocol,
  PROTOCOL_STEWARD_LED,
} from "@/lib/representation/protocol-types";

type ProtocolState = {
  protocol: RepresentationProtocol;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

/**
 * Fetch & cache the representation protocol for the current org.
 */
export function useRepresentationProtocol(): ProtocolState {
  const { currentOrg } = useOrg();
  const organizationId = currentOrg?.organizationId;

  const [protocol, setProtocol] = useState<RepresentationProtocol>(PROTOCOL_STEWARD_LED);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProtocol = async () => {
    if (!organizationId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/representation-protocol`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setProtocol(data.protocol ?? PROTOCOL_STEWARD_LED);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load protocol");
      // Keep default steward-led protocol on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProtocol();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  return { protocol, isLoading, error, refetch: fetchProtocol };
}
