import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: string;
  title: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
}

export default function EmptyState({ icon = "◇", title, sub, children }: EmptyStateProps) {
  return (
    <div className="emptyState">
      <div className="emptyStateIcon">{icon}</div>
      <div className="emptyStateTitle">{title}</div>
      {sub && <div className="emptyStateSub">{sub}</div>}
      {children}
    </div>
  );
}
