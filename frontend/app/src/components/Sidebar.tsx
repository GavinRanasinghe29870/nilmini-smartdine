"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { sidebarMenu } from "../config/sidebarMenu";
import { logout } from "@/app/src/lib/auth";
import clsx from "clsx";
import { useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  async function handleLogout() {
    if (loggingOut) return;

    const confirmed = window.confirm("Are you sure you want to logout?");

    if (!confirmed) return;

    try {
      setLoggingOut(true);
      setLogoutError("");

      await logout();

      router.replace("/login");
      router.refresh();
    } catch (error) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : "Logout failed. Please try again."
      );
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <aside className="w-64 min-h-screen bg-[#111315] text-white flex flex-col">
      <div className="px-6 py-6 flex items-center justify-center">
        <Image
          src="/logo_without_text.png"
          alt="Nilmini SmartDine Logo"
          width={90}
          height={90}
          priority
          className="object-contain"
        />
      </div>

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

      <div className="p-4 border-t border-gray-800">
        {logoutError && (
          <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {logoutError}
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-3 text-gray-400 hover:text-white w-full px-4 py-3 rounded-lg hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <LogOut size={20} />
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </aside>
  );
}