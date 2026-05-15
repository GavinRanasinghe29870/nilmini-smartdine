"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Sidebar from "../src/components/Sidebar";
import TopBar from "../src/components/TopBar";
import { verify } from "../src/lib/auth";

const STAFF_PANEL_ROLES = ["OWNER", "MANAGER"];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      try {
        const data = await verify();
        const role = data?.user?.role;

        if (!STAFF_PANEL_ROLES.includes(role)) {
          if (active) {
            setAllowed(false);
            setChecking(false);
          }

          router.replace("/login");
          return;
        }

        if (active) {
          setAllowed(true);
          setChecking(false);
        }
      } catch {
        if (active) {
          setAllowed(false);
          setChecking(false);
        }

        router.replace("/login");
      }
    }

    checkAccess();

    return () => {
      active = false;
    };
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0f1012] flex items-center justify-center">
        <p className="text-gray-400">Checking access...</p>
      </div>
    );
  }

  if (!allowed) return null;

  return (
    <div className="flex min-h-screen bg-[#0f1012]">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <header className="h-16 flex items-center justify-end px-8 border-b border-white/5">
          <TopBar />
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}