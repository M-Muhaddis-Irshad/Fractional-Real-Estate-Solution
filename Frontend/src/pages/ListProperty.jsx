import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useApp } from "../context/AppContext";

const INITIAL = {
  name: "",
  city: "",
  type: "Residential",
  description: "",
  totalValue: "",
  pricePerShare: "",
  totalShares: "",
  yieldPct: "",
};

export default function ListProperty() {
  const { addProperty } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [error, setError] = useState(null);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    const { name, city, type, description, totalValue, pricePerShare, totalShares, yieldPct } = form;

    if (!name.trim() || !city.trim() || !description.trim()) {
      setError("Please fill in all text fields.");
      return;
    }
    if (!totalValue || !pricePerShare || !totalShares || !yieldPct) {
      setError("Please fill in all numeric fields.");
      return;
    }
    if (parseInt(totalValue, 10) <= 0 || parseInt(pricePerShare, 10) <= 0 || parseInt(totalShares, 10) <= 0 || parseFloat(yieldPct) <= 0) {
      setError("Numeric values must be greater than zero.");
      return;
    }

    const result = addProperty(form);
    if (result.ok) {
      navigate(`/property/${result.property.id}`);
    }
  };

  return (
    <div className="formPage">
      <Link to="/" className="backLink">← Back to Discover</Link>
      <h1 className="formTitle">List a property</h1>

      <form className="propertyForm" onSubmit={handleSubmit}>
        <div className="formGrid">
          <label className="formField">
            <span className="formLabel">Property name</span>
            <input className="formInput" value={form.name} onChange={set("name")} placeholder="e.g. Ocean View Tower" />
          </label>
          <label className="formField">
            <span className="formLabel">City</span>
            <input className="formInput" value={form.city} onChange={set("city")} placeholder="e.g. Karachi, Sindh" />
          </label>
          <label className="formField">
            <span className="formLabel">Type</span>
            <select className="formInput" value={form.type} onChange={set("type")}>
              <option>Residential</option>
              <option>Commercial</option>
              <option>Industrial</option>
            </select>
          </label>
          <label className="formField">
            <span className="formLabel">Total value (PKR)</span>
            <input className="formInput" type="number" min="1" value={form.totalValue} onChange={set("totalValue")} placeholder="e.g. 50000000" />
          </label>
          <label className="formField">
            <span className="formLabel">Price per share (PKR)</span>
            <input className="formInput" type="number" min="1" value={form.pricePerShare} onChange={set("pricePerShare")} placeholder="e.g. 25000" />
          </label>
          <label className="formField">
            <span className="formLabel">Total shares</span>
            <input className="formInput" type="number" min="1" value={form.totalShares} onChange={set("totalShares")} placeholder="e.g. 2000" />
          </label>
          <label className="formField">
            <span className="formLabel">Projected annual yield (%)</span>
            <input className="formInput" type="number" step="0.1" min="0.1" value={form.yieldPct} onChange={set("yieldPct")} placeholder="e.g. 8.5" />
          </label>
        </div>
        <label className="formField formFieldFull">
          <span className="formLabel">Description</span>
          <textarea className="formInput formTextarea" value={form.description} onChange={set("description")} placeholder="Describe the property, location, income potential…" rows={4} />
        </label>

        {error && <div className="errorText">{error}</div>}

        <div className="formActions">
          <button className="primaryBtn" type="submit">List property</button>
          <Link className="ghostBtn" to="/">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
