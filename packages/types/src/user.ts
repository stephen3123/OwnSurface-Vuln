export type Plan = "free" | "pro" | "business" | "enterprise";

export interface User {
  id: string;
  email: string;
  name?: string;
  plan: Plan;
  team_id?: string;
  scans_today: number;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at?: string;
  requests_today: number;
  is_active: boolean;
  created_at: string;
}

export interface CreateApiKeyResponse {
  api_key: ApiKey;
  key: string; // Full key, shown only once
}

export const PLAN_LIMITS: Record<Plan, { scans_per_day: number; watchlists: number; team_members: number; bulk_max: number; api_access: boolean }> = {
  free: { scans_per_day: 5, watchlists: 1, team_members: 0, bulk_max: 0, api_access: false },
  pro: { scans_per_day: 100, watchlists: 10, team_members: 0, bulk_max: 50, api_access: true },
  business: { scans_per_day: 1000, watchlists: 50, team_members: 20, bulk_max: 500, api_access: true },
  enterprise: { scans_per_day: -1, watchlists: -1, team_members: -1, bulk_max: -1, api_access: true },
};
