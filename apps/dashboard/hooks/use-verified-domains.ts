"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";

export interface VerifiedDomain {
  id: string;
  domain: string;
  verified: boolean;
  verified_at: string | null;
  created_at: string;
}

export function useVerifiedDomains() {
  const [domains, setDomains] = useState<VerifiedDomain[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.request<any>("/domains");
      const items = Array.isArray(res.data) ? res.data : (res.data?.domains ?? []);
      const verified = items
        .filter((d: any) => d.verified === true || d.status === "verified")
        .map((d: any) => ({
          id: String(d.id),
          domain: String(d.domain),
          verified: true,
          verified_at: d.verified_at ? String(d.verified_at) : null,
          created_at: String(d.created_at),
        }));
      setDomains(verified);
    } catch {
      setDomains([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { domains, loading, reload: load };
}
