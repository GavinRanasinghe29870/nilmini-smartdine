"use client";

import Image from "next/image";
import Link from "next/link";
// import { usePathname } from "next/navigation";
import { Bell, LogOut, Pencil, User, EyeOff } from "lucide-react";

export default function EditProfilePage() {
  // const pathname = usePathname();

  return (
    <div className="min-h-screen bg-bg-1 text-foreground flex">

      {/* Sidebar */}
      <aside className="w-64 p-6">
        <h1 className="text-h4 font-semibold mb-8">Profile</h1>

        <div className="bg-bg-2 rounded-xl p-2 space-y-1">
          <Link
            href="/myProfile"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5"
          >
            <User size={18} />
            My Profile
          </Link>

          <Link
            href="/myProfile/editMyProfile"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/20 text-primary"
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

      {/* Main */}
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

        {/* Edit Card */}
        <div className="max-w-4xl mx-auto bg-bg-2 rounded-2xl p-8">

          {/* Title */}
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-h4 font-semibold">
              Edit Profile
            </h2>
            <span className="flex items-center gap-1 text-xs bg-primary/20 text-primary px-3 py-1 rounded-full">
              <Pencil size={12} />
              Editing
            </span>
          </div>

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="relative w-16 h-16">

              <Image
                src="https://i.pravatar.cc/150?img=3"
                alt="profile"
                fill
                className="rounded-full object-cover"
                unoptimized
              />

              {/* EDIT */}
              <button
                type="button"
                className="absolute -bottom-1 -right-1 bg-primary p-1.5 rounded-full hover:opacity-90"
                title="Change profile picture"
              >
                <Pencil size={14} className="text-white" />
              </button>

            </div>

            <div>
              <p className="text-h5 font-medium">John Doe</p>
              <p className="text-sm text-secondary">Manager</p>
            </div>
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 gap-5">
            <InputField label="First Name" value="John Doe" />
            <InputField label="Email" value="johndoe123@gmail.com" />
            <InputField label="Phone Number" value="077 xxxxxx" />
            <InputField label="Date of Birth" value="20.09.2002" />

            <div className="grid grid-cols-2 gap-4">
              <PasswordField label="New Password" />
              <PasswordField label="Confirm Password" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 mt-10">
            <Link
              href="/myProfile"
              className="px-6 py-2 rounded-lg text-white/60 hover:text-white"
            >
              Cancel
            </Link>

            <button className="px-6 py-2 rounded-lg bg-primary text-white hover:opacity-90">
              Save Changes
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}

function InputField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <label className="block text-sm mb-2 text-white/70">
        {label}
      </label>
      <input
        defaultValue={value}
        className="w-full bg-bg-1 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}

function PasswordField({ label }: { label: string }) {
  return (
    <div>
      <label className="block text-sm mb-2 text-white/70">
        {label}
      </label>
      <div className="relative">
        <input
          type="password"
          className="w-full bg-bg-1 rounded-lg px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-primary"
        />
        <EyeOff
          size={18}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 cursor-pointer"
        />
      </div>
    </div>
  );
}
