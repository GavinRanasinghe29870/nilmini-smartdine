"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Clock,
  PackageCheck,
  Sparkles,
} from "lucide-react";
import Image from "next/image";

import { api } from "../lib/axios";
import { verify } from "../lib/auth";
import { getStaffImageSrc } from "../lib/api/staff.api";

type LoggedUser = {
  id?: string;
  _id?: string;
  fullName?: string;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  image?: string;
};

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: "inventory" | "menuApprove" | "todayMenu";
  createdAt: number;
};

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  items?: T;
  results?: T;
};

type InventoryItem = {
  id?: string;
  _id?: string;
  name?: string;
  itemName?: string;
  ingredientName?: string;
  stockName?: string;
  updatedAt?: string;
  createdAt?: string;
  lastUpdated?: string;
};

type GeneratedMenu = {
  id?: string;
  _id?: string;
  menuDate?: string;
  status?: "draft" | "approved" | "rejected" | string;
  generatedAt?: string;
  approvedAt?: string;
  updatedAt?: string;
  createdAt?: string;
};

const INVENTORY_ENDPOINTS = ["/inventory", "/inventory/items"];

const INVENTORY_RECENT_WINDOW_MS = 30 * 60 * 1000;
const NOTIFICATION_REFRESH_MS = 60 * 1000;

function unwrapArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];

  const response = payload as ApiResponse<T[]>;

  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.results)) return response.results;

  return [];
}

function unwrapOne<T>(payload: unknown): T | null {
  if (!payload) return null;

  const response = payload as ApiResponse<T>;

  if (response.data && !Array.isArray(response.data)) return response.data;
  if (response.items && !Array.isArray(response.items)) return response.items;
  if (response.results && !Array.isArray(response.results)) {
    return response.results;
  }

  return payload as T;
}

function getDisplayName(user: LoggedUser | null) {
  return (
    user?.fullName ||
    user?.name ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "User"
  );
}

function getNotificationIcon(type: NotificationItem["icon"]) {
  if (type === "inventory") {
    return <PackageCheck size={18} />;
  }

  if (type === "menuApprove") {
    return <CheckCircle2 size={18} />;
  }

  return <Sparkles size={18} />;
}

function getReadableTime(value?: string | number | Date) {
  if (!value) return "Just now";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return date.toLocaleString("en-LK", {
    timeZone: "Asia/Colombo",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDateTimeNumber(value?: string) {
  if (!value) return 0;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 0;

  return date.getTime();
}

function getColomboDateString(offsetDays = 0) {
  const colomboDate = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Colombo",
    })
  );

  colomboDate.setDate(colomboDate.getDate() + offsetDays);

  const year = colomboDate.getFullYear();
  const month = String(colomboDate.getMonth() + 1).padStart(2, "0");
  const day = String(colomboDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isAfterMenuApproveTime() {
  const hourText = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Colombo",
    hour: "2-digit",
    hour12: false,
  }).format(new Date());

  const hour = Number(hourText);

  return Number.isFinite(hour) && hour >= 17;
}

function isSameDate(dateValue?: string, dateString?: string) {
  if (!dateValue || !dateString) return false;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return false;

  const year = date.toLocaleString("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
  });

  const month = date.toLocaleString("en-CA", {
    timeZone: "Asia/Colombo",
    month: "2-digit",
  });

  const day = date.toLocaleString("en-CA", {
    timeZone: "Asia/Colombo",
    day: "2-digit",
  });

  return `${year}-${month}-${day}` === dateString;
}

function getInventoryItemName(item: InventoryItem) {
  return (
    item.name ||
    item.itemName ||
    item.ingredientName ||
    item.stockName ||
    "Inventory item"
  );
}

async function fetchLatestInventoryUpdate() {
  for (const endpoint of INVENTORY_ENDPOINTS) {
    try {
      const response = await api.get(endpoint, {
        params: {
          limit: 25,
        },
      });

      const items = unwrapArray<InventoryItem>(response.data);

      if (items.length === 0) continue;

      const sorted = [...items].sort((a, b) => {
        const aTime = getDateTimeNumber(
          a.updatedAt || a.lastUpdated || a.createdAt
        );

        const bTime = getDateTimeNumber(
          b.updatedAt || b.lastUpdated || b.createdAt
        );

        return bTime - aTime;
      });

      const latest = sorted[0];

      const latestTime = getDateTimeNumber(
        latest.updatedAt || latest.lastUpdated || latest.createdAt
      );

      if (!latestTime) return null;

      const isRecent = Date.now() - latestTime <= INVENTORY_RECENT_WINDOW_MS;

      if (!isRecent) return null;

      return {
        item: latest,
        latestTime,
      };
    } catch {
      continue;
    }
  }

  return null;
}

async function fetchAiMenuList() {
  try {
    const response = await api.get("/ai-menu");
    return unwrapArray<GeneratedMenu>(response.data);
  } catch {
    return [];
  }
}

async function fetchTodayMenu() {
  try {
    const response = await api.get("/ai-menu/today");
    return unwrapOne<GeneratedMenu>(response.data);
  } catch {
    return null;
  }
}

export default function TopBar() {
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(true);

  const [user, setUser] = useState<LoggedUser | null>(null);
  const [profileImage, setProfileImage] = useState("/profile.jpg");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const refreshNotifications = useCallback(async () => {
    const nextNotifications: NotificationItem[] = [];

    const latestInventory = await fetchLatestInventoryUpdate();

    if (latestInventory) {
      const itemName = getInventoryItemName(latestInventory.item);

      nextNotifications.push({
        id: `inventory-${latestInventory.item._id || latestInventory.item.id}`,
        title: "Inventory update",
        description: `${itemName} was updated recently.`,
        time: getReadableTime(latestInventory.latestTime),
        icon: "inventory",
        createdAt: latestInventory.latestTime,
      });
    }

    const tomorrowDate = getColomboDateString(1);
    const todayDate = getColomboDateString(0);

    const menus = await fetchAiMenuList();

    const tomorrowDraftMenu = menus.find((menu) => {
      return menu.menuDate === tomorrowDate && menu.status === "draft";
    });

    if (isAfterMenuApproveTime() && tomorrowDraftMenu) {
      const generatedTime =
        getDateTimeNumber(
          tomorrowDraftMenu.generatedAt ||
          tomorrowDraftMenu.updatedAt ||
          tomorrowDraftMenu.createdAt
        ) || Date.now();

      nextNotifications.push({
        id: `approve-menu-${tomorrowDraftMenu._id || tomorrowDraftMenu.id}`,
        title: "Predicted menu ready to approve",
        description:
          "Tomorrow’s AI predicted menu is ready for manager approval.",
        time: getReadableTime(generatedTime),
        icon: "menuApprove",
        createdAt: generatedTime,
      });
    }

    const todayMenu = await fetchTodayMenu();

    if (
      todayMenu &&
      todayMenu.status === "approved" &&
      (todayMenu.menuDate === todayDate ||
        isSameDate(todayMenu.approvedAt || todayMenu.updatedAt, todayDate))
    ) {
      const menuTime =
        getDateTimeNumber(
          todayMenu.approvedAt || todayMenu.updatedAt || todayMenu.createdAt
        ) || Date.now();

      nextNotifications.push({
        id: `today-menu-${todayMenu._id || todayMenu.id}`,
        title: "Today menu update",
        description: "Today’s approved menu is available for customer orders.",
        time: getReadableTime(menuTime),
        icon: "todayMenu",
        createdAt: menuTime,
      });
    }

    nextNotifications.sort((a, b) => b.createdAt - a.createdAt);

    if (mountedRef.current) {
      setNotifications(nextNotifications);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(async () => {
      try {
        const data = await verify();
        const loggedUser = data?.user as LoggedUser | undefined;

        if (!mountedRef.current || !loggedUser) return;

        setUser(loggedUser);

        if (loggedUser.image) {
          setProfileImage(getStaffImageSrc(loggedUser.image));
        }
      } catch {
        if (!mountedRef.current) return;

        setUser(null);
        setProfileImage("/profile.jpg");
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void refreshNotifications();
    }, 0);

    const interval = window.setInterval(() => {
      void refreshNotifications();
    }, NOTIFICATION_REFRESH_MS);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [refreshNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex items-center gap-4">
      <div className="hidden sm:block text-right">
        <p className="text-sm font-medium text-white">
          Welcome <span className="text-primary">{getDisplayName(user)}</span>
        </p>

        {user?.role && (
          <p className="text-xs text-gray-400 capitalize">
            {user.role.toLowerCase()}
          </p>
        )}
      </div>

      <div ref={notificationRef} className="relative">
        <button
          type="button"
          onClick={() => setNotificationOpen((previous) => !previous)}
          className="relative p-2 rounded-full bg-bg-2 hover:bg-bg-1 transition"
        >
          <Bell size={18} />

          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-black text-[10px] font-bold flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </button>

        {notificationOpen && (
          <div className="absolute right-0 top-12 w-80 bg-bg-2 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h3 className="text-sm font-semibold text-white">
                Notifications
              </h3>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm font-medium text-white">
                    No notifications right now
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    New alerts will appear when inventory is updated, menu
                    approval time arrives, or today’s menu is updated.
                  </p>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 px-4 py-4 hover:bg-bg-1 transition border-b border-white/5 last:border-b-0"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      {getNotificationIcon(item.icon)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">
                        {item.title}
                      </p>

                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="flex items-center gap-1 mt-2 text-[11px] text-gray-500">
                        <Clock size={12} />
                        <span>{item.time}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        className="flex items-center gap-2 p-1 rounded-full hover:bg-bg-1 transition"
      >
        <div className="w-9 h-9 rounded-full overflow-hidden relative bg-bg-2 border border-white/10">
          <Image
            src={profileImage}
            alt="Profile"
            fill
            className="object-cover"
            onError={() => setProfileImage("/profile.jpg")}
            sizes="36px"
          />
        </div>
      </button>
    </div>
  );
}