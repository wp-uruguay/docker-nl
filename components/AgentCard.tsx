import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWandMagicSparkles,
  faBullhorn,
  faHandshake,
  faGraduationCap,
} from "@fortawesome/free-solid-svg-icons";

type IconKey = "magic" | "bullhorn" | "handshake" | "graduation";

const ICONS: Record<IconKey, any> = {
  magic: faWandMagicSparkles,
  bullhorn: faBullhorn,
  handshake: faHandshake,
  graduation: faGraduationCap,
};

export default function AgentCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: IconKey;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-zinc-200 bg-white p-5 hover:bg-zinc-50 transition"
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-zinc-900">
          <FontAwesomeIcon icon={ICONS[icon]} className="text-lg" />
        </span>
        <div className="min-w-0">
          <div className="text-lg font-semibold text-zinc-900">{title}</div>
          <div className="mt-0.5 text-sm text-zinc-600 line-clamp-2">{description}</div>
        </div>
      </div>

      <div className="mt-4 text-sm text-zinc-600">
        Abrir → <span className="text-zinc-900 font-medium">Chat</span>
      </div>
    </Link>
  );
}
