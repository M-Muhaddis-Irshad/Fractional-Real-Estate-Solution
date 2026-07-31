export const money = (n) =>
  "$" + Math.round(n).toLocaleString("en-US", { maximumFractionDigits: 0 });

export const moneyCents = (n) =>
  "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const moneyShort = (n) => {
  const abs = Math.abs(n);
  if (abs >= 1e9) return "$" + (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (abs >= 1e6) return "$" + (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (abs >= 1e3) return "$" + (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return money(n);
};

export const pct = (n, digits = 2) => `${n.toFixed(digits)}%`;
