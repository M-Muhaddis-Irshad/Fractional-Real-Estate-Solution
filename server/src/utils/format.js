export const money = (n) =>
  "Rs" + Math.round(n).toLocaleString("en-US", { maximumFractionDigits: 0 });

export function nowParts() {
  const d = new Date();
  return {
    date: d.toISOString().slice(0, 10),
    time: d.toISOString().slice(11, 16),
  };
}
