import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
}

export default function EmptyState({ icon = <Inbox size={22} />, title, sub, children }: EmptyStateProps) {
  return (
    <div className="emptyState">
      <div className="emptyStateIcon">{icon}</div>
      <div className="emptyStateTitle">{title}</div>
      {sub && <div className="emptyStateSub">{sub}</div>}
      {children}
    </div>
  );
}
