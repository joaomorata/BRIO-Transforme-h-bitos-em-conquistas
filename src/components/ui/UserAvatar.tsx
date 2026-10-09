import { cn } from "@/lib/utils";

interface UserAvatarProps {
  url?: string | null;
  color?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}

// Só aceitamos fotos que estão no NOSSO bucket de avatares. O campo da foto
// é gravado pelo próprio usuário, então sem essa checagem alguém poderia
// apontar pra qualquer imagem externa e ela apareceria pra todo mundo
// (ex: no Ranking).
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
const ALLOWED_PREFIX = SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public/avatars/` : "";

function isTrustedAvatarUrl(url?: string | null): url is string {
  return !!url && !!ALLOWED_PREFIX && url.startsWith(ALLOWED_PREFIX);
}

export default function UserAvatar({ url, color, name, size = 40, className }: UserAvatarProps) {
  const initials = (name || "U").slice(0, 2).toUpperCase();

  if (isTrustedAvatarUrl(url)) {
    return (
      <img
        src={url}
        alt={name || "Avatar"}
        style={{ width: size, height: size }}
        className={cn("rounded-2xl object-cover shrink-0", className)}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, backgroundColor: color || "#7c3aed" }}
      className={cn(
        "rounded-2xl flex items-center justify-center font-bold text-white shrink-0",
        className
      )}
    >
      <span style={{ fontSize: size * 0.36 }}>{initials}</span>
    </div>
  );
}
