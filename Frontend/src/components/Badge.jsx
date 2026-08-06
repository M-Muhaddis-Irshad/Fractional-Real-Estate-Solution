import { statusTone } from "../lib/format";

const LABELS = {
  active: "Active",
  approved: "Approved",
  completed: "Completed",
  pending: "Pending",
  suspended: "Suspended",
  rejected: "Rejected",
  cancelled: "Cancelled",
  inactive: "Inactive",
};

export default function Badge({ status, label, tone }) {
  const t = tone || statusTone(status);
  const text = label || LABELS[status] || status;
  return <span className={`badge badge${t[0].toUpperCase()}${t.slice(1)}`}>{text}</span>;
}
