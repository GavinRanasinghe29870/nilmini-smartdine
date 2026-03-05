"use client";

import { Bell } from "lucide-react";
import Image from "next/image";

export default function TopBar() {
  return (
    <div className="flex items-center gap-4">
      {/* Notification Button */}
      <button className="relative p-2 rounded-full bg-bg-2 hover:bg-bg-1 transition">
        <Bell size={18} />

        {/* Notification dot */}
        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
      </button>

      {/* Profile Button */}
      <button className="flex items-center gap-2 p-1 rounded-full hover:bg-bg-1 transition">
        <div className="w-9 h-9 rounded-full overflow-hidden relative">
          <Image
            src="/profile.jpg"
            alt="Profile"
            fill
            className="object-cover"
          />
        </div>
      </button>
    </div>
  );
}
