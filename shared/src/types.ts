export type UserRole = 
  | "user" 
  | "super_admin" 
  | "content_admin" 
  | "finance_admin" 
  | "work_admin";

export type UserStatus = "active" | "suspended" | "pending";

export type ProgramStatus = "published" | "draft" | "archived";

export type LessonType = "video" | "text" | "download" | "quiz";

export type ResourceAccessType = "public" | "enrolled" | "achievement_locked";

export type PurchaseStatus = "completed" | "refunded" | "cancelled";

export type JobStatus = "published" | "draft" | "closed" | "archived";

export type JobPaymentType = "fixed" | "hourly" | "milestone";

export type JobWorkType = "remote" | "hybrid" | "on_site";

export type JobDifficulty = "beginner" | "intermediate" | "advanced";

export type ApplicationStatus = 
  | "submitted" 
  | "under_review" 
  | "shortlisted" 
  | "accepted" 
  | "in_progress" 
  | "revision_required" 
  | "completed" 
  | "rejected" 
  | "cancelled";

export type CommissionStatus = 
  | "pending" 
  | "approved" 
  | "available" 
  | "paid" 
  | "rejected" 
  | "reversed" 
  | "refunded";

export type WalletTransactionType = 
  | "PROGRAM_PURCHASE" 
  | "AFFILIATE_COMMISSION" 
  | "WORK_PAYOUT" 
  | "WITHDRAWAL" 
  | "ADMIN_ADJUSTMENT" 
  | "REFUND"
  | "FEE";

export type WithdrawalStatus = 
  | "requested" 
  | "under_review" 
  | "approved" 
  | "processing" 
  | "completed" 
  | "rejected" 
  | "cancelled";

export type PayoutMethod = "bank_transfer" | "upi" | "paypal";

export type AchievementConditionMode = "ALL" | "ANY";

export type AchievementMetric = 
  | "affiliate_sales" 
  | "valid_referrals" 
  | "total_sales_amount" 
  | "completed_jobs" 
  | "approved_jobs" 
  | "completed_programs" 
  | "total_earnings";

export type ConditionOperator = ">=" | ">" | "==" | "<=" | "<";

export interface AchievementCondition {
  metric: AchievementMetric;
  operator: ConditionOperator;
  value: number;
}

export interface AchievementUnlockAction {
  positionId?: string;
  badgeName?: string;
  jobCategoryAccess?: string;
  resourceAccess?: boolean;
}

export type NotificationType = 
  | "job" 
  | "application" 
  | "course" 
  | "certificate" 
  | "affiliate" 
  | "commission" 
  | "withdrawal" 
  | "achievement" 
  | "announcement" 
  | "security";
