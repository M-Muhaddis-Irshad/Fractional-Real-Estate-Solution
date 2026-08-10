import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";

const EMPTY = {
  name: "",
  city: "",
  type: "Residential",
  description: "",
  totalValue: "",
  pricePerShare: "",
  totalShares: "",
  yieldPct: "",
  imageUrl: "",
};

function fromProperty(p) {
  return {
    name: p.name,
    city: p.city,
    type: p.type,
    description: p.description,
    totalValue: p.totalValue,
    pricePerShare: p.pricePerShare,
    totalShares: p.totalShares,
    yieldPct: p.yieldPct,
    imageUrl: p.imageUrl || "",
  };
}

function PropertyFormBody({ initial, editingId, onDone }) {
  const { createProperty, updateProperty } = useAdmin();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const { name, city, description, totalValue, pricePerShare, totalShares, yieldPct } = form;
    if (form.imageUrl && !/^https?:\/\//i.test(form.imageUrl.trim())) {
      setError("Image URL must start with http:// or https://");
      return;
    }
    if (!name.trim() || !city.trim() || !description.trim()) {
      setError("Please fill in all text fields.");
      return;
    }
    if (!totalValue || !pricePerShare || !totalShares || !yieldPct) {
      setError("Please fill in all numeric fields.");
      return;
    }
    if (+totalValue <= 0 || +pricePerShare <= 0 || +totalShares <= 0 || +yieldPct <= 0) {
      setError("Numeric values must be greater than zero.");
      return;
    }

    setSubmitting(true);
    const result = editingId ? await updateProperty(editingId, form) : await createProperty(form);
    setSubmitting(false);

    if (result.ok) {
      onDone();
    } else {
      setError(result.error);
    }
  };

  return (
    <form className="card cardPad aFormCard" onSubmit={handleSubmit}>
      <div className="aFormGrid">
        <label className="field">
          <span className="fieldLabel">Property name</span>
          <input className="input" value={form.name} onChange={set("name")} placeholder="e.g. Ocean View Tower" />
        </label>
        <label className="field">
          <span className="fieldLabel">City</span>
          <input className="input" value={form.city} onChange={set("city")} placeholder="e.g. Karachi, Sindh" />
        </label>
        <label className="field">
          <span className="fieldLabel">Type</span>
          <select className="select" value={form.type} onChange={set("type")}>
            <option>Residential</option>
            <option>Commercial</option>
            <option>Industrial</option>
            <option>Mixed-Use</option>
          </select>
        </label>
        <label className="field">
          <span className="fieldLabel">Total value (PKR)</span>
          <input className="input" type="number" min="1" value={form.totalValue} onChange={set("totalValue")} placeholder="e.g. 50000000" />
        </label>
        <label className="field">
          <span className="fieldLabel">Price per share (PKR)</span>
          <input className="input" type="number" min="1" value={form.pricePerShare} onChange={set("pricePerShare")} placeholder="e.g. 25000" />
        </label>
        <label className="field">
          <span className="fieldLabel">Total shares</span>
          <input className="input" type="number" min="1" value={form.totalShares} onChange={set("totalShares")} placeholder="e.g. 2000" />
        </label>
        <label className="field">
          <span className="fieldLabel">Projected annual yield (%)</span>
          <input className="input" type="number" step="0.1" min="0.1" value={form.yieldPct} onChange={set("yieldPct")} placeholder="e.g. 8.5" />
        </label>
        <label className="field" style={{ gridColumn: "1 / -1" }}>
          <span className="fieldLabel">Image URL (optional)</span>
          <input className="input" value={form.imageUrl} onChange={set("imageUrl")} placeholder="https://images.unsplash.com/photo-…?auto=format&fit=crop&w=1400&q=80" />
          <span className="fieldHint">Paste a direct link to a high-resolution photo (Unsplash, Pexels, etc.). If empty, a branded gradient placeholder is used.</span>
        </label>
      </div>
      <label className="field" style={{ marginTop: 16 }}>
        <span className="fieldLabel">Description</span>
        <textarea className="textarea" rows={4} value={form.description} onChange={set("description")} placeholder="Describe the property, location, income potential…" />
      </label>

      {error && <div className="errorText" style={{ marginTop: 14 }}>{error}</div>}

      <div className="aFormActions">
        <button className="btn btnPrimary" disabled={submitting}>
          {submitting ? "Saving…" : editingId ? "Save changes" : "Create listing"}
        </button>
        <Link to="/admin/properties" className="btn btnGhost">Cancel</Link>
      </div>
    </form>
  );
}

export default function AdminPropertyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { properties } = useAdmin();
  const editing = id ? properties.find((p) => p.id === id) : null;

  return (
    <div className="riseIn">
      <div className="pageHead">
        <div>
          <div className="pageEyebrow">{editing ? "Edit" : "New"}</div>
          <h1 className="pageTitle">{editing ? `Edit ${editing.name}` : "List a property"}</h1>
          <p className="pageSub">New listings require admin approval before they go live.</p>
        </div>
        <Link to="/admin/properties" className="btn btnGhost">← Back to properties</Link>
      </div>

      <PropertyFormBody
        key={editing ? editing.id : "new"}
        initial={editing ? fromProperty(editing) : EMPTY}
        editingId={editing ? editing.id : null}
        onDone={() => navigate("/admin/properties")}
      />
    </div>
  );
}
