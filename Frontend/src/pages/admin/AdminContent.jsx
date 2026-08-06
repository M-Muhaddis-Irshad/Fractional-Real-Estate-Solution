import { useState } from "react";
import { useAdmin } from "../../context/AdminContext";

function ListEditor({ items, onChange, fields, placeholder }) {
  const update = (i, key, val) => onChange(items.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)));
  const add = () => onChange([...items, Object.fromEntries(fields.map((f) => [f.key, ""]))]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="aContentList">
      {items.map((it, i) => (
        <div className="aContentItem" key={i}>
          {fields.map((f) =>
            f.type === "textarea" ? (
              <textarea
                key={f.key}
                className="textarea"
                rows={2}
                placeholder={f.placeholder}
                value={it[f.key] || ""}
                onChange={(e) => update(i, f.key, e.target.value)}
              />
            ) : (
              <input
                key={f.key}
                className="input"
                placeholder={f.placeholder}
                value={it[f.key] || ""}
                onChange={(e) => update(i, f.key, e.target.value)}
              />
            )
          )}
          <button className="btn btnDanger btnSm" onClick={() => remove(i)}>Remove</button>
        </div>
      ))}
      <button className="btn btnGhost btnSm" onClick={add}>{placeholder}</button>
    </div>
  );
}

const TABS = [
  { key: "hero", label: "Hero" },
  { key: "stats", label: "Stats" },
  { key: "features", label: "Features" },
  { key: "testimonials", label: "Testimonials" },
  { key: "faqs", label: "FAQ" },
  { key: "blog", label: "Blog" },
  { key: "cta", label: "CTA" },
];

function ContentEditor({ content }) {
  const { saveContent } = useAdmin();
  const [tab, setTab] = useState("hero");
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(content)));
  const [saving, setSaving] = useState(false);

  const set = (key) => (val) => setDraft((d) => ({ ...d, [key]: val }));
  const setHero = (key) => (e) =>
    setDraft((d) => ({ ...d, hero: { ...d.hero, [key]: e.target.value } }));

  const handleSave = async () => {
    setSaving(true);
    await saveContent(draft);
    setSaving(false);
  };

  return (
    <div className="riseIn">
      <div className="pageHead">
        <div>
          <div className="pageEyebrow">Platform</div>
          <h1 className="pageTitle">Content management</h1>
          <p className="pageSub">Edit everything shown on the public homepage — changes go live immediately.</p>
        </div>
        <button className="btn btnPrimary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save content"}
        </button>
      </div>

      <div className="tabs" style={{ marginBottom: 18, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t.key} className={"tab" + (tab === t.key ? " tabActive" : "")} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "hero" && (
        <div className="card cardPad aFormGrid">
          <label className="field"><span className="fieldLabel">Badge</span><input className="input" value={draft.hero.badge} onChange={setHero("badge")} /></label>
          <label className="field"><span className="fieldLabel">Title</span><input className="input" value={draft.hero.title} onChange={setHero("title")} /></label>
          <label className="field"><span className="fieldLabel">Highlight (gradient text)</span><input className="input" value={draft.hero.highlight} onChange={setHero("highlight")} /></label>
          <label className="field fieldFull"><span className="fieldLabel">Subtitle</span><textarea className="textarea" value={draft.hero.subtitle} onChange={setHero("subtitle")} /></label>
          <label className="field"><span className="fieldLabel">Primary CTA</span><input className="input" value={draft.hero.primaryCta} onChange={setHero("primaryCta")} /></label>
          <label className="field"><span className="fieldLabel">Secondary CTA</span><input className="input" value={draft.hero.secondaryCta} onChange={setHero("secondaryCta")} /></label>
        </div>
      )}

      {tab === "stats" && (
        <div className="card cardPad">
          <div className="cardSub" style={{ marginBottom: 14 }}>Hero statistics (label / value pairs).</div>
          <ListEditor
            items={draft.stats || []}
            onChange={set("stats")}
            fields={[
              { key: "label", placeholder: "Label, e.g. Avg. Yield" },
              { key: "value", placeholder: "Value, e.g. 8.6%" },
            ]}
            placeholder="+ Add statistic"
          />
        </div>
      )}

      {tab === "features" && (
        <div className="card cardPad">
          <ListEditor
            items={draft.features || []}
            onChange={set("features")}
            fields={[
              { key: "title", placeholder: "Feature title" },
              { key: "text", placeholder: "Feature description", type: "textarea" },
            ]}
            placeholder="+ Add feature"
          />
        </div>
      )}

      {tab === "testimonials" && (
        <div className="card cardPad">
          <ListEditor
            items={draft.testimonials || []}
            onChange={set("testimonials")}
            fields={[
              { key: "quote", placeholder: "Quote", type: "textarea" },
              { key: "name", placeholder: "Name" },
              { key: "role", placeholder: "Role" },
            ]}
            placeholder="+ Add testimonial"
          />
        </div>
      )}

      {tab === "faqs" && (
        <div className="card cardPad">
          <ListEditor
            items={draft.faqs || []}
            onChange={set("faqs")}
            fields={[
              { key: "q", placeholder: "Question" },
              { key: "a", placeholder: "Answer", type: "textarea" },
            ]}
            placeholder="+ Add question"
          />
        </div>
      )}

      {tab === "blog" && (
        <div className="card cardPad">
          <ListEditor
            items={draft.blog || []}
            onChange={set("blog")}
            fields={[
              { key: "title", placeholder: "Post title" },
              { key: "excerpt", placeholder: "Excerpt", type: "textarea" },
              { key: "date", placeholder: "Date, e.g. Jul 18, 2026" },
              { key: "tag", placeholder: "Tag, e.g. Insights" },
            ]}
            placeholder="+ Add post"
          />
        </div>
      )}

      {tab === "cta" && (
        <div className="card cardPad aFormGrid">
          <label className="field fieldFull"><span className="fieldLabel">Title</span><input className="input" value={draft.cta.title} onChange={(e) => setDraft((d) => ({ ...d, cta: { ...d.cta, title: e.target.value } }))} /></label>
          <label className="field fieldFull"><span className="fieldLabel">Subtitle</span><textarea className="textarea" value={draft.cta.subtitle} onChange={(e) => setDraft((d) => ({ ...d, cta: { ...d.cta, subtitle: e.target.value } }))} /></label>
          <label className="field"><span className="fieldLabel">Button</span><input className="input" value={draft.cta.button} onChange={(e) => setDraft((d) => ({ ...d, cta: { ...d.cta, button: e.target.value } }))} /></label>
        </div>
      )}
    </div>
  );
}

export default function AdminContent() {
  const { content } = useAdmin();
  if (!content) {
    return (
      <div className="aPageLoading">
        <div className="spinner" />
      </div>
    );
  }
  return <ContentEditor key={JSON.stringify(content)} content={content} />;
}
