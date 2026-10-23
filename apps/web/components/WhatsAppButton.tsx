import { WhatsAppIcon } from "./icons";

export function WhatsAppButton({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn bg-[#178a45] text-white hover:bg-[#126f37] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#178a45] ${className}`}
    >
      <WhatsAppIcon />
      {children}
    </a>
  );
}
