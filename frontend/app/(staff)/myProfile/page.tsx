"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Pencil, User } from "lucide-react";

export default function ProfilePage() {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-bg-1 text-foreground flex">

      {/* Sidebar */}
      <aside className="w-64 p-6">
        <h1 className="text-h4 font-semibold mb-8">Profile</h1>

        <div className="bg-bg-2 rounded-xl p-2 space-y-1">
          <Link
            href="/myProfile"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg
              ${pathname === "/myProfile"
                ? "bg-primary/20 text-primary"
                : "hover:bg-white/5"
              }`}
          >
            <User size={18} />
            My Profile
          </Link>

          <Link
            href="/myProfile/editMyProfile"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg
              ${pathname === "/myProfile/editMyProfile"
                ? "bg-primary/20 text-primary"
                : "hover:bg-white/5"
              }`}
          >
            <Pencil size={18} />
            Edit Profile
          </Link>

          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-red-400">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 relative">

        {/* Top Right */}
        <div className="absolute top-6 right-8 flex items-center gap-4">
          <Bell className="text-white/70" />
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <Image
              src="https://i.pravatar.cc/150?img=3"
              alt="user"
              width={32}
              height={32}
              unoptimized
            />
          </div>
        </div>

        {/* Profile Card */}
        <div className="max-w-4xl mx-auto bg-bg-2 rounded-2xl p-8">

          <h2 className="text-h4 font-semibold mb-6">
            Personal Information
          </h2>

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full overflow-hidden">
              <Image
                src="https://i.pravatar.cc/150?img=3"
                alt="profile"
                width={64}
                height={64}
                unoptimized
              />
            </div>

            <div>
              <p className="text-h5 font-medium">John Doe</p>
              <p className="text-sm text-secondary">Manager</p>
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 gap-5">
            <ProfileField label="First Name" value="John Doe" />
            <ProfileField label="Email" value="johndoe123@gmail.com" />
            <ProfileField label="Phone Number" value="077 xxxxxx" />
            <ProfileField label="Date of Birth" value="20.09.2002" />
            <ProfileField label="Salary (LKR)" value="1000.00" suffix="Per Day" />
          </div>
        </div>
      </main>
    </div>
  );
}

function ProfileField({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div>
      <label className="block text-sm mb-2 text-white/70">
        {label}
      </label>
      <div className="relative bg-bg-1 rounded-lg px-4 py-3">
        {value}
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
