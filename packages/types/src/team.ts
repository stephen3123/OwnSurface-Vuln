export type TeamRole = "admin" | "member";

export interface Team {
  id: string;
  name: string;
  owner_id: string;
  plan: string;
  member_count?: number;
  created_at: string;
}

export interface TeamMember {
  user_id: string;
  email: string;
  name?: string;
  role: TeamRole;
  joined_at: string;
}

export interface CreateTeamRequest {
  name: string;
}

export interface InviteMemberRequest {
  email: string;
  role?: TeamRole;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  team_name?: string;
  email: string;
  role: TeamRole;
  invited_by: string;
  accepted: boolean;
  created_at: string;
  expires_at: string;
}
