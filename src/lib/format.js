export const money = (n) =>
  "PKR " + Math.round(n).toLocaleString("en-PK", { maximumFractionDigits: 0 });

export const pct = (n, digits = 2) => `${n.toFixed(digits)}%`;
