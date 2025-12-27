"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { sidebarMenu } from "../config/sidebarMenu";
import clsx from "clsx";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-[#111315] text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 text-2xl font-semibold text-purple-400">
        Logo
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 space-y-1">
        {sidebarMenu.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition",
                isActive
                  ? "bg-purple-500 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <button className="flex items-center gap-3 text-gray-400 hover:text-white w-full px-4 py-3 rounded-lg hover:bg-gray-800">
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}
