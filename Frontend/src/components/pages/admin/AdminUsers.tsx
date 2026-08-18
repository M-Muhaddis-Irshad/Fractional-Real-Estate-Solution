"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { useAdmin } from "@/context/AdminContext";
import Badge from "@/components/Badge";
import Avatar from "@/components/Avatar";
import Modal from "@/components/Modal";
import { money, fmtDate, fmtDateTime } from "@/lib/format";
import type { Activity, Transaction, User } from "@/lib/types";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "active", label: "Active" },
  { key: "suspended", label: "Suspended" },
  { key: "rejected", label: "Rejected" },
];

interface UserDetailResponse {
  activities?: Activity[];
}

export default function AdminUsers() {
  const { users, requests, transactions, setUserStatus, deleteUser } = useAdmin();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState<User | null>(null);
  const [detailData, setDetailData] = useState<UserDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const openDetail = async (u: User) => {
    setDetail(u);
    setDetailData(null);
    setDetailLoading(true);
    try {
      const res = await api<UserDetailResponse>(`/admin/users/${u.id}`);
      setDetailData(res);
    } catch {
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const txByUser = useMemo(() => {
    const map = new Map<string, { count: number; total: number; txns: Transaction[] }>();
    for (const t of transactions) {
      if (!t.user) continue;
      const id = t.user.id;
      const e = map.get(id) || { count: 0, total: 0, txns: [] };
      e.count += 1;
      e.total += t.total;
      e.txns.push(t);
      map.set(id, e);
    }
    return map;
  }, [transactions]);

  const reqByUser = useMemo(() => {
    const map = new Map<string, typeof requests>();
    for (const r of requests) {
      if (!r.user) continue;
      const list = map.get(r.user.id) || [];
      list.push(r);
      map.set(r.user.id, list);
    }
    return map;
  }, [requests]);

  const visible = useMemo(() => {
    let list = users;
    if (filter !== "all") list = list.filter((u) => u.status === filter);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(
        (u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
      );
    }
    return list;
  }, [users, filter, q]);

  const detailInvested = detail ? txByUser.get(detail.id)?.total || 0 : 0;

  return (
    <div className="riseIn">
      <div className="pageHead">
        <div>
          <div className="pageEyebrow">Management</div>
          <h1 className="pageTitle">Users</h1>
          <p className="pageSub">Review, approve, suspend and manage investor accounts.</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="searchBox">
          <span className="searchIcon">
            <Search size={14} />
          </span>
          <input
            className="input"
            placeholder="Search by name or email..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="pillRow">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={"pill" + (filter === f.key ? " pillActive" : "")}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="tableWrap">
        <div className="tableScroll">
          <table className="dataTable">
            <thead>
              <tr>
                <th>User</th>
                <th>Status</th>
                <th>Invested</th>
                <th>Requests</th>
                <th>Joined</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="tableEmpty">
                    No users found.
                  </td>
                </tr>
              )}
              {visible.map((u) => {
                const invested = txByUser.get(u.id)?.total || 0;
                const reqCount = reqByUser.get(u.id)?.length || 0;
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="aPropCell">
                        <Avatar name={u.name} size="sm" />
                        <div>
                          <div className="dStrong">{u.name}</div>
                          <div className="dMuted">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge status={u.status} />
                    </td>
                    <td className="dStrong">{money(invested)}</td>
                    <td>{reqCount}</td>
                    <td className="dMuted">{fmtDate(u.createdAt)}</td>
                    <td>{u.role === "superadmin" ? <Badge status="active" label="Admin" /> : "Investor"}</td>
                    <td>
                      <div className="aRowActions aRowActionsWrap">
                        <button className="btn btnGhost btnSm" onClick={() => openDetail(u)}>
                          View
                        </button>
                        {u.status === "pending" && (
                          <button className="btn btnSuccess btnSm" onClick={() => setUserStatus(u.id, "approve")}>
                            Approve
                          </button>
                        )}
                        {u.status === "pending" && (
                          <button className="btn btnDanger btnSm" onClick={() => setUserStatus(u.id, "reject")}>
                            Reject
                          </button>
                        )}
                        {u.status === "active" && (
                          <button className="btn btnGhost btnSm" onClick={() => setUserStatus(u.id, "suspend")}>
                            Suspend
                          </button>
                        )}
                        {u.status === "suspended" && (
                          <button className="btn btnSuccess btnSm" onClick={() => setUserStatus(u.id, "restore")}>
                            Restore
                          </button>
                        )}
                        <button className="btn btnDanger btnSm" onClick={() => deleteUser(u.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <Modal title={detail.name} onClose={() => setDetail(null)} wide>
          <div className="aUserDetail">
            <div className="aUserDetailHead">
              <Avatar name={detail.name} size="lg" />
              <div>
                <div className="aUserDetailEmail">{detail.email}</div>
                <div className="aUserDetailMeta">
                  <Badge status={detail.status} />{" "}
                  {detail.role === "superadmin" && <Badge status="active" label="Admin" />}
                </div>
              </div>
              <div className="aUserDetailStat">
                <div className="kpiLabel">Total invested</div>
                <div className="kpiValue">{money(detailInvested)}</div>
              </div>
            </div>

            <div className="sectionHeading">Investments</div>
            {(txByUser.get(detail.id)?.txns || []).length === 0 ? (
              <div className="dCardBodyEmpty">No investments yet.</div>
            ) : (
              <div className="tableWrap">
                <div className="tableScroll">
                  <table className="dataTable">
                    <thead>
                      <tr>
                        <th>Property</th>
                        <th>Shares</th>
                        <th>Total</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(txByUser.get(detail.id)?.txns || []).map((t) => (
                        <tr key={t.id}>
                          <td className="dStrong">{t.propertyName}</td>
                          <td>{t.shares}</td>
                          <td className="dStrong">{money(t.total)}</td>
                          <td className="dMuted">{t.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="sectionHeading">Purchase requests</div>
            {(reqByUser.get(detail.id) || []).length === 0 ? (
              <div className="dCardBodyEmpty">No requests.</div>
            ) : (
              <div className="tableWrap">
                <div className="tableScroll">
                  <table className="dataTable">
                    <thead>
                      <tr>
                        <th>Property</th>
                        <th>Shares</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reqByUser.get(detail.id) || []).map((r) => (
                        <tr key={r.id}>
                          <td className="dStrong">{r.propertyName}</td>
                          <td>{r.shares}</td>
                          <td>{money(r.totalCost)}</td>
                          <td>
                            <Badge status={r.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="sectionHeading">Activity history</div>
            {detailLoading ? (
              <div className="dCardBodyEmpty">
                <div className="spinner spinnerSm" style={{ margin: "0 auto" }} />
              </div>
            ) : !detailData?.activities || detailData.activities.length === 0 ? (
              <div className="dCardBodyEmpty">No activity recorded.</div>
            ) : (
              <div className="aActivityList">
                {detailData.activities.map((a) => (
                  <div className="aActivityRow" key={a.id}>
                    <div className="aActivityBody">
                      <div className="aActivityMsg">{a.message}</div>
                      <div className="aActivityMeta">{fmtDateTime(a.createdAt)}</div>
                    </div>
                    <span className="aActivityType">{a.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
