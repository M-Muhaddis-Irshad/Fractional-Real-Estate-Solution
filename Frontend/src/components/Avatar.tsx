import { initialsOf, hueFrom } from "@/lib/format";

interface AvatarProps {
  name?: string | null;
  size?: "sm" | "md" | "lg";
  src?: string | null;
}

export default function Avatar({ name, size = "md", src }: AvatarProps) {
  const hue = hueFrom(name || "?");
  const cls = { sm: "avatarSm", md: "avatarMd", lg: "avatarLg" }[size] || "avatarMd";
  if (src) {
    return <img src={src} alt={name || ""} className={`avatar ${cls}`} style={{ objectFit: "cover" }} />;
  }
  return (
    <span
      className={`avatar ${cls}`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 70% 48%), hsl(${(hue + 45) % 360} 70% 38%))`,
      }}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
}
