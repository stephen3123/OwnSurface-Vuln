export interface Watchlist {
  id: string;
  user_id: string;
  team_id?: string;
  name: string;
  urls: string[];
  check_interval: number;
  alert_email: boolean;
  alert_slack_webhook?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWatchlistRequest {
  name: string;
  urls: string[];
  check_interval?: number;
  alert_email?: boolean;
  alert_slack_webhook?: string;
}

export interface UpdateWatchlistRequest {
  name?: string;
  urls?: string[];
  check_interval?: number;
  alert_email?: boolean;
  alert_slack_webhook?: string;
}

export type ChangeType =
  | "tech_added"
  | "tech_removed"
  | "tech_updated"
  | "security_improved"
  | "security_degraded"
  | "seo_change"
  | "social_change"
  | "business_signal"
  | "content_change";

export interface WatchlistChange {
  id: string;
  watchlist_id: string;
  url: string;
  change_type: ChangeType;
  old_value: unknown;
  new_value: unknown;
  detected_at: string;
}
