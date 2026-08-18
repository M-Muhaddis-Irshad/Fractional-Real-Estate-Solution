"use client";

import { Bell, BellRing } from "lucide-react";
import { useApp } from "@/context/AppContext";
import EmptyState from "@/components/EmptyState";
import { fmtDateTime } from "@/lib/format";

export default function Notifications() {
  const { notifications, markNotificationRead } = useApp();

  return (
    <div className="riseIn">
      <div className="pageHead">
        <div>
          <div className="pageEyebrow">Inbox</div>
          <h1 className="pageTitle">Notifications</h1>
          <p className="pageSub">Announcements and updates from the Flux team.</p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Bell size={22} />} title="You're all caught up" sub="Announcements from the platform will appear here." />
        </div>
      ) : (
        <div className="dNotifList">
          {notifications.map((n) => (
            <button
              key={n.id}
              className={"dNotif" + (n.read ? "" : " dNotifUnread")}
              onClick={() => !n.read && markNotificationRead(n.id)}
            >
              <span className="dNotifIcon">{n.read ? <Bell size={15} /> : <BellRing size={15} />}</span>
              <span className="dNotifBody">
                <span className="dNotifTitle">{n.title}</span>
                <span className="dNotifMsg">{n.message}</span>
                <span className="dNotifMeta">{fmtDateTime(n.createdAt)}</span>
              </span>
              {!n.read && <span className="dUnreadDot" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
