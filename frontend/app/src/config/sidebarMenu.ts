import {
  LayoutDashboard,
  Users,
  Package,
  ClipboardList,
  FileText,
  ShoppingBag,
} from "lucide-react";

export const sidebarMenu = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Menu",
    href: "/menu/predictedMenu",
    icon: ClipboardList,
  },
  {
    label: "StaffManagement",
    href: "/staffManagement",
    icon: Users,
  },
  {
    label: "Inventory",
    href: "/inventory/inventoryManagement",
    icon: Package,
  },
  {
    label: "Products",
    href: "/products/productsManagement",
    icon: ShoppingBag,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: FileText,
  },
];
