"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Plus, Search } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import EmptyState from "@/components/EmptyState";
import { moneyShort } from "@/lib/format";
import type { Property } from "@/lib/types";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "active", label: "Active" },
  { key: "rejected", label: "Rejected" },
  { key: "inactive", label: "Inactive" },
];

export default function AdminProperties() {
  const { properties, setPropertyStatus, toggleFeatured, toggleInvesting, deleteProperty } = useAdmin();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [toDelete, setToDelete] = useState<Property | null>(null);

  const visible = useMemo(() => {
    let list = properties;
    if (filter !== "all") list = list.filter((p) => p.status === filter);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.city.toLowerCase().includes(s) ||
          p.type.toLowerCase().includes(s)
      );
    }
    return list;
  }, [properties, filter, q]);

  return (
    <div className="riseIn">
      <div className="pageHead">
        <div>
          <div className="pageEyebrow">Management</div>
          <h1 className="pageTitle">Properties</h1>
          <p className="pageSub">Approve listings, edit assets, and manage their status.</p>
        </div>
        <Link href="/admin/properties/new" className="btn btnPrimary">
          <Plus size={15} /> Add property
        </Link>
      </div>

      <div className="toolbar">
        <div className="searchBox">
          <span className="searchIcon">
            <Search size={14} />
          </span>
          <input
            className="input"
            placeholder="Search properties..."
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
                <th>Property</th>
                <th>Type</th>
                <th>Value</th>
                <th>Yield</th>
                <th>Funding</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Investing</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={9} className="tableEmpty">
                    <EmptyState icon={<Building2 size={22} />} title="No properties found" sub="Try a different filter or add a new property." />
                  </td>
                </tr>
              )}
              {visible.map((p) => {
                const pct = p.totalShares ? Math.round((p.soldShares / p.totalShares) * 100) : 0;
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="aPropCell">
                        <span
                          className="aPropThumb"
                          style={{
                            background: p.imageUrl
                              ? `url(${p.imageUrl}) center/cover`
                              : `hsl(${p.hue} 45% 30%)`,
                          }}
                        >
                          {!p.imageUrl && p.initials}
                        </span>
                        <div>
                          <div className="dStrong">{p.name}</div>
                          <div className="dMuted">{p.city}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.type}</td>
                    <td className="dStrong">{moneyShort(p.totalValue)}</td>
                    <td>{p.yieldPct}%</td>
                    <td>
                      <div className="aFundCell">
                        <div className="progress">
                          <div className="progressFill" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="dMuted">
                          {p.soldShares}/{p.totalShares} · {pct}%
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge status={p.status} label={p.status} />
                    </td>
                    <td>
                      <label className="switch" title="Toggle featured">
                        <input
                          type="checkbox"
                          checked={!!p.featured}
                          onChange={(e) => toggleFeatured(p.id, e.target.checked)}
                        />
                        <span className="switchTrack" />
                      </label>
                    </td>
                    <td>
                      <label className="switch" title="Pause / resume investing">
                        <input
                          type="checkbox"
                          checked={p.investingOpen !== false}
                          onChange={(e) => toggleInvesting(p.id, e.target.checked)}
                        />
                        <span className="switchTrack" />
                      </label>
                    </td>
                    <td>
                      <div className="aRowActions">
                        {(p.status === "pending" || p.status === "rejected") && (
                          <button
                            className="btn btnSuccess btnSm"
                            onClick={() => setPropertyStatus(p.id, "approve")}
                          >
                            Approve
                          </button>
                        )}
                        {p.status === "pending" && (
                          <button
                            className="btn btnDanger btnSm"
                            onClick={() => setPropertyStatus(p.id, "reject")}
                          >
                            Reject
                          </button>
                        )}
                        <button
                          className="btn btnGhost btnSm"
                          onClick={() => router.push(`/admin/properties/${p.id}/edit`)}
                        >
                          Edit
                        </button>
                        <button className="btn btnDanger btnSm" onClick={() => setToDelete(p)}>
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

      {toDelete && (
        <Modal
          title="Delete property"
          onClose={() => setToDelete(null)}
          footer={
            <>
              <button className="btn btnGhost" onClick={() => setToDelete(null)}>
                Cancel
              </button>
              <button
                className="btn btnDanger"
                onClick={() => {
                  deleteProperty(toDelete.id);
                  setToDelete(null);
                }}
              >
                Delete
              </button>
            </>
          }
        >
          <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>
            Remove <strong style={{ color: "var(--ink)" }}>{toDelete.name}</strong> from the
            platform? The listing will be deactivated and hidden from the marketplace.
          </p>
        </Modal>
      )}
    </div>
  );
}
