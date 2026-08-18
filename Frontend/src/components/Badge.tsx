import type { ReactNode } from "react";
import { statusTone } from "@/lib/format";

const LABELS: Record<string, string> = {
  active: "Active",
  approved: "Approved",
  completed: "Completed",
  pending: "Pending",
  suspended: "Suspended",
  rejected: "Rejected",
  cancelled: "Cancelled",
  inactive: "Inactive",
};

interface BadgeProps {
  status?: string;
  label?: string;
  tone?: string;
  children?: ReactNode;
}

export default function Badge({ status, label, tone, children }: BadgeProps) {
  const t = tone || statusTone(status);
  const text = label || (status ? LABELS[status] || status : status);
  return <span className={`badge badge${t[0].toUpperCase()}${t.slice(1)}`}>{children ?? text}</span>;
}
