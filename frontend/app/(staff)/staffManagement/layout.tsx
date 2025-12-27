import React from "react";

export default function StaffManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#0f1012]">
      {children}
    </div>
  );
}
