export type Direction = "long" | "short";

export interface Trade {
  id: string;
  user_id: string;
  symbol: string;
  direction: Direction;
  session: string | null;
  setup: string | null;
  entry: number | null;
  exit: number | null;
  size: number | null;
  r_multiple: number | null;
  pnl: number | null;
  notes: string | null;
  ai_score: number | null;
  ai_headline: string | null;
  ai_summary: string | null;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
}

export type VideoCategory =
  | "trade-review"
  | "psychology"
  | "market-analysis"
  | "other";

export interface Video {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: VideoCategory;
  tags: string[];
  storage_path: string;
  thumbnail_path: string | null;
  related_trade_id: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export type Priority = "low" | "normal" | "high";

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_at: string | null;
  priority: Priority;
  done: boolean;
  created_at: string;
}

export type PayoutStatus = "pending" | "paid";

export interface Payout {
  id: string;
  user_id: string;
  prop_firm: string;
  amount: number;
  currency: string;
  payout_date: string;
  status: PayoutStatus;
  proof_path: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

export interface ChallengeCertificate {
  id: string;
  user_id: string;
  prop_firm: string;
  challenge_name: string;
  passed_date: string;
  certificate_path: string;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

export interface TradingPlan {
  id: string;
  user_id: string;
  content: string;
  updated_at: string;
}

export interface TradeInsight {
  id: string;
  user_id: string;
  summary: string;
  trade_count: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type ContentStage =
  | "idea"
  | "guion"
  | "grabar"
  | "editar"
  | "listo"
  | "publicado";

export interface ContentIdea {
  id: string;
  user_id: string;
  title: string;
  stage: ContentStage;
  platform: string | null;
  notes: string | null;
  series: string | null;
  content_type: string | null;
  record_location: string | null;
  scheduled_date: string | null;
  published_date: string | null;
  published_link: string | null;
  sort_order: number;
  created_at: string;
}

export interface ContentBlueprint {
  id: string;
  user_id: string;
  content: string;
  updated_at: string;
}
