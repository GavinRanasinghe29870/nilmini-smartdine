"use client";

import { useState } from "react";
import { ArrowLeft, Bell, Calendar } from "lucide-react";
import DataTable, { Column } from "../../../src/components/DataTable";
import { useRouter, usePathname } from "next/navigation";

/* Types */
type StaffReport = {
    staffId: string;
    staffName: string;
    date: string;
    arrivalTime: string;
    departureTime: string;
    expenses: string;
    totalPayment: string;
};

const reportTabs = [
    { label: "Revenue Report", path: "/reports/revenueReport" },
    { label: "Staff Report", path: "/reports/staffReport" },
    { label: "Sales Report", path: "/reports/salesReport" },
];

/* Dummy Data */
const tableData: StaffReport[] = Array.from({ length: 6 }).map(() => ({
    staffId: "01",
    staffName: "Chicken Permeson",
    date: "28.03.2024",
    arrivalTime: "6 : 30",
    departureTime: "19 : 30",
    expenses: "LKR 300.00",
    totalPayment: "$800.00",
}));

/* Table Columns */
const columns: Column<StaffReport>[] = [
    { key: "staffId", label: "Staff ID" },
    { key: "staffName", label: "Staff Name" },
    { key: "date", label: "Date" },
    { key: "arrivalTime", label: "Arrival Time", align: "center" },
    { key: "departureTime", label: "Departure Time", align: "center" },
    { key: "expenses", label: "Staff expenses", align: "right" },
    { key: "totalPayment", label: "Total Payment", align: "right" },
];

/* PAGE */
export default function ReportsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const [activeTab, setActiveTab] = useState("staff");
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipText, setTooltipText] = useState("");
    /* Donut values */
    const percentage = 25;
    const radius = 80;
    const stroke = 25;
    const normalizedRadius = radius - stroke * 0.5;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset =
        circumference - (percentage / 100) * circumference;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="items-center justify-between">
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-full bg-bg-2 hover:bg-bg-1"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <h1 className="text-h4 font-semibold">Staff Report</h1>
                </div>
                <div className="flex items-center justify-between">
                    {/* Tabs */}
                    <div className="flex gap-3">
                        {reportTabs.map((tab) => {
                            const isActive = pathname === tab.path;

                            return (
                                <button
                                    key={tab.path}
                                    onClick={() => router.push(tab.path)}
                                    className={`px-5 py-2 rounded-lg text-sm font-medium transition
            ${isActive
                                            ? "bg-primary text-black"
                                            : "bg-bg-2 text-gray-400 hover:bg-bg-1"
                                        }
          `}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-2 text-paragraph">
                            <Calendar size={16} />
                            <span>01/04/2024 – 08/04/2024</span>
                        </div>

                        <button className="px-5 py-2 rounded-xl bg-primary text-text-black text-paragraph font-medium whitespace-nowrap">
                            Generate Report
                        </button>
                    </div>
                </div>
            </div>

            {/* Chart Card */}
            <div className="bg-bg-2 rounded-2xl p-6 w-[420px]">
                <h2 className="text-h6 text-gray-300 mb-4">
                    Total Staff - 50
                </h2>

                <div className="flex items-center gap-6">
                    {/* Donut Chart */}
                    <div className="relative">
                        {/* Tooltip */}
                        {showTooltip && (
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-bg-1 text-white text-xs px-3 py-1 rounded-md shadow-lg whitespace-nowrap">
                                {tooltipText}
                            </div>
                        )}

                        <svg width={160} height={160}>
                            {/* Background circle */}
                            <circle
                                stroke="#1f1f1f"
                                fill="transparent"
                                strokeWidth={stroke}
                                r={normalizedRadius}
                                cx={80}
                                cy={80}
                            />

                            {/* Income segment*/}
                            <circle
                                stroke="var(--bg-1)"
                                fill="transparent"
                                strokeWidth={stroke}
                                strokeLinecap="round"
                                strokeDasharray={`${circumference} ${circumference}`}
                                strokeDashoffset={circumference - (80 / 100) * circumference}
                                r={normalizedRadius}
                                cx={80}
                                cy={80}
                                transform="rotate(-90 80 80)"
                                style={{ pointerEvents: 'stroke' }}
                                onMouseEnter={() => {
                                    setShowTooltip(true);
                                    setTooltipText("Income – 80%");
                                }}
                                onMouseLeave={() => setShowTooltip(false)}
                            />

                            {/* Staff payments segment */}
                            <circle
                                stroke="var(--primary)"
                                fill="transparent"
                                strokeWidth={stroke}
                                strokeLinecap="round"
                                strokeDasharray={`${circumference} ${circumference}`}
                                strokeDashoffset={strokeDashoffset}
                                r={normalizedRadius}
                                cx={80}
                                cy={80}
                                transform={`rotate(${-90 + (80 / 100) * 360} 80 80)`}
                                style={{ pointerEvents: 'stroke' }}
                                onMouseEnter={() => {
                                    setShowTooltip(true);
                                    setTooltipText("Staff payments – 20%");
                                }}
                                onMouseLeave={() => setShowTooltip(false)}
                            />
                        </svg>
                    </div>
                    {/* Legend */}
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-bg-1" />
                            <span>Income</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-primary" />
                            <span>Staff payments</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <DataTable columns={columns} data={tableData} />
        </div>
    );
}
