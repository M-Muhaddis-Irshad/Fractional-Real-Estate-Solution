"use client";

import { useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import Badge from "@/components/Badge";
import { fmtDateTime } from "@/lib/format";

const EMPTY = { title: "", message: "", audience: "all", channel: "in_app" };

export default function AdminNotifications() {
  const { notifications, sendNotification, deleteNotification } = useAdmin();
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);

  const set = (k: keyof typeof EMPTY) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;
    setSending(true);
    await sendNotification(form);
    setSending(false);
    setForm(EMPTY);
  };

  return (
    <div className="riseIn">
      <div className="pageHead">
        <div>
          <div className="pageEyebrow">Platform</div>
          <h1 className="pageTitle">Notifications</h1>
          <p className="pageSub">Compose announcements delivered to users in-app and via other channels.</p>
        </div>
      </div>

      <div className="grid-2-1">
        <form className="card cardPad" onSubmit={handleSend}>
          <div className="cardTitle">Send announcement</div>
          <div className="cardSub">The message appears in every recipient&apos;s notification inbox.</div>
          <div className="aFormGrid" style={{ marginTop: 16 }}>
            <label className="field">
              <span className="fieldLabel">Title</span>
              <input
                className="input"
                value={form.title}
                onChange={set("title")}
                placeholder="e.g. New property live"
                maxLength={120}
              />
            </label>
            <label className="field">
              <span className="fieldLabel">Audience</span>
              <select className="select" value={form.audience} onChange={set("audience")}>
                <option value="all">All users</option>
                <option value="users">Investors only</option>
                <option value="admins">Admins only</option>
              </select>
            </label>
            <label className="field">
              <span className="fieldLabel">Channel</span>
              <select className="select" value={form.channel} onChange={set("channel")}>
                <option value="in_app">In-app</option>
                <option value="email">Email</option>
                <option value="push">Push</option>
              </select>
            </label>
            <label className="field">
              <span className="fieldLabel">Message</span>
              <textarea
                className="textarea"
                value={form.message}
                onChange={set("message")}
                placeholder="Write your announcement…"
                maxLength={1000}
              />
            </label>
          </div>
          <div className="aFormActions">
            <button
              className="btn btnPrimary"
              disabled={sending || !form.title.trim() || !form.message.trim()}
            >
              {sending ? "Sending…" : "Send announcement"}
            </button>
          </div>
          <div className="fieldHint" style={{ marginTop: 10 }}>
            Email and push delivery require an external provider — these are recorded here for the
            audit trail.
          </div>
        </form>

        <div className="card">
          <div className="cardHead">
            <div className="cardTitle">Sent announcements</div>
          </div>
          <div className="dMiniList">
            {notifications.length === 0 && <div className="dCardBodyEmpty">No announcements sent yet.</div>}
            {notifications.map((n) => (
              <div className="dMiniRow" key={n.id}>
                <div>
                  <div className="dMiniName">{n.title}</div>
                  <div className="dMiniMeta">
                    {fmtDateTime(n.createdAt)} · {n.audience}
                  </div>
                  <div className="dMiniMeta" style={{ marginTop: 3 }}>
                    {n.message}
                  </div>
                </div>
                <div className="dMiniRight">
                  <Badge status="active" label={n.channel} />
                  <button className="btn btnDanger btnSm" onClick={() => deleteNotification(n.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
