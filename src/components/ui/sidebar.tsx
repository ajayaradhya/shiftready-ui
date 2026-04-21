import { Box, CreditCard, Headphones, Truck } from "lucide-react";
import Link from "next/link";

const navItems = [
  { icon: Truck, label: "Logistics", href: "#", active: false },
  { icon: Box, label: "Inventory", href: "/inventory", active: true },
  { icon: CreditCard, label: "Finances", href: "#", active: false },
  { icon: Headphones, label: "Concierge", href: "#", active: false },
];

export function Sidebar() {
  return (
    <nav className="fixed left-0 top-0 h-full w-20 flex flex-col items-center py-8 gap-10 bg-surface-container-lowest border-r border-outline-variant/10 z-50">
      {navItems.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={`flex flex-col items-center gap-2 group transition-all ${
            item.active ? "text-primary" : "text-outline hover:text-primary"
          }`}
        >
          <item.icon 
            size={24} 
            strokeWidth={item.active ? 2.5 : 1.5} 
            className="transition-transform group-hover:scale-110" 
          />
          <span className={`text-[10px] uppercase tracking-widest font-medium ${
            item.active ? "font-bold" : ""
          }`}>
            {item.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}