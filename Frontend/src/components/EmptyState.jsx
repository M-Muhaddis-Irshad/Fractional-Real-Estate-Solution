export default function EmptyState({ icon = "◇", title, sub, children }) {
  return (
    <div className="emptyState">
      <div className="emptyStateIcon">{icon}</div>
      <div className="emptyStateTitle">{title}</div>
      {sub && <div className="emptyStateSub">{sub}</div>}
      {children}
    </div>
  );
}
