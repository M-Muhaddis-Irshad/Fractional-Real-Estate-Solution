import React from "react";

export default function Stat({ label, value }) {
  return (
    <div className="statBox">
      <div className="statValue">{value}</div>
      <div className="statLabel">{label}</div>
    </div>
  );
}
