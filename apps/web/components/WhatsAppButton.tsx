import { WhatsAppIcon } from "./icons";

export function WhatsAppButton({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-[#178a45] px-5 py-3 font-semibold text-white shadow transition hover:bg-[#126f37] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#178a45] ${className}`}
    >
      <WhatsAppIcon />
      {children}
    </a>
  );
}
