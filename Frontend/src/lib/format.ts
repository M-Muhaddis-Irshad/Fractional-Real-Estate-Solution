export const money = (n: number): string =>
  "Rs " + Math.round(n).toLocaleString("en-US", { maximumFractionDigits: 0 });

export const moneyCents = (n: number): string =>
  "Rs " +
  Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const cryptoFmt = (n: number | string, currency = ""): string => {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  const digits = currency === "BTC" ? 6 : currency === "ETH" ? 4 : 2;
  return (
    v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: digits }) +
    (currency ? ` ${currency}` : "")
  );
};

export const moneyShort = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 1e9) return "Rs " + (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (abs >= 1e6) return "Rs " + (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (abs >= 1e3) return "Rs " + (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return money(n);
};

export const pct = (n: number, digits = 2): string => `${n.toFixed(digits)}%`;

export const compactNum = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (abs >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (abs >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(Math.round(n));
};

export function timeAgo(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function fmtDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function fmtDateTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  );
}

export function initialsOf(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function hueFrom(str?: string | null): number {
  let h = 0;
  const s = str || "";
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

export const shortHash = (h?: string | number | null, head = 10, tail = 6): string => {
  const s = String(h || "");
  if (!s) return "—";
  return s.length <= head + tail ? s : `${s.slice(0, head)}…${s.slice(-tail)}`;
};

export function statusTone(status?: string): string {
  const map: Record<string, string> = {
    active: "success",
    approved: "success",
    completed: "success",
    pending: "warn",
    suspended: "warn",
    rejected: "danger",
    cancelled: "danger",
    inactive: "neutral",
    denied: "danger",
  };
  return (status && map[status]) || "neutral";
}
