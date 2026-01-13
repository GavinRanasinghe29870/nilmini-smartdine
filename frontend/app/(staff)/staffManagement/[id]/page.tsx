"use client";

import { ArrowLeft, Camera, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

const staff = {
  fullName: "Watson Joyce",
  role: "Manager",
  salary: "$2000.00",
  email: "watsonjoyce112@gmail.com",
  phone: "+1 (123) 123 4654",
  dob: "01-Jun-1965",
  address: "House # 14 Street 123, USA, Chicago",
  image:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80",
};

export default function StaffDetailPage() {
  const router = useRouter();

  return (
    <main className="flex-1 overflow-auto bg-bg-1 text-white">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-bg-2 hover:bg-secondary transition"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold">{staff.fullName}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Profile Image */}
          <div className="bg-bg-2 rounded-xl p-6 flex flex-col items-center">
            <div className="relative mb-6">
              <img
                src={staff.image}
                alt={staff.fullName}
                className="w-64 h-64 object-cover rounded-lg"
              />
              <button className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-primary p-3 rounded-full hover:bg-secondary transition">
                <Camera size={20} className="text-text-black" />
              </button>
            </div>

            <button className="w-full bg-primary text-text-black font-medium py-3 rounded-lg hover:bg-secondary transition">
              Edit profile
            </button>

            <button className="w-full mt-4 border border-red-500/50 text-red-400 font-medium py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-red-500/10 transition">
              <Trash2 size={18} />
              Delete profile
            </button>
          </div>

          {/* Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Employee Personal Details */}
            <div className="bg-bg-2 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-6 text-text-white">
                Employee Personal Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="text-text-white">Full Name</p>
                  <p className="font-medium">{staff.fullName}</p>
                </div>
                <div>
                  <p className="text-text-white">Email</p>
                  <p className="font-medium">{staff.email}</p>
                </div>
                <div>
                  <p className="text-text-white">Phone number</p>
                  <p className="font-medium">{staff.phone}</p>
                </div>
                <div>
                  <p className="text-text-white">Date of birth</p>
                  <p className="font-medium">{staff.dob}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-text-white">Address</p>
                  <p className="font-medium">{staff.address}</p>
                </div>
              </div>
            </div>

            {/* Employee Job Details */}
            <div className="bg-bg-2 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-6 text-text-white">
                Employee Job Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                <div>
                  <p className="text-text-white">Role</p>
                  <p className="text-2xl font-semibold text-[#a5b4fc]">{staff.role}</p>
                </div>
                <div>
                  <p className="text-text-white">Salary</p>
                  <p className="text-2xl font-semibold text-[#a5b4fc]">{staff.salary}</p>
                </div>
                <div>
                  <p className="text-text-white">Shift start timing</p>
                  <p className="font-medium">9am</p>
                </div>
                <div>
                  <p className="text-text-white">Shift end timing</p>
                  <p className="font-medium">6pm</p>
                </div>
              </div>
            </div>

            {/* Employee Expenses Form */}
            <div className="bg-bg-2 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-6 text-gray-300">
                Employee Expenses
              </h3>
              <div className="space-y-4">
                <div className="flex gap-4 items-center">
                  <select className="flex-1 bg-[#3D4142] rounded-lg px-4 py-3 text-sm">
                    <option>HotDog</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Enter the Price (USD)"
                    className="flex-1 bg-[#3D4142] rounded-lg px-4 py-3 text-sm placeholder-gray-500"
                  />
                </div>

                <div className="flex gap-4 items-center">
                  <select className="flex-1 bg-[#3D4142] rounded-lg px-4 py-3 text-sm">
                    <option>Select</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Enter the Price (USD)"
                    className="flex-1 bg-[#3D4142] rounded-lg px-4 py-3 text-sm placeholder-gray-500"
                  />
                </div>

                <div className="flex gap-4 items-center">
                  <input
                    type="text"
                    placeholder="Enter the Expense Name"
                    className="flex-1 bg-[#3D4142] rounded-lg px-4 py-3 text-sm placeholder-gray-500"
                  />
                  <input
                    type="text"
                    placeholder="Enter the Price (USD)"
                    className="flex-1 bg-[#3D4142] rounded-lg px-4 py-3 text-sm placeholder-gray-500"
                  />
                </div>

                <button className="w-full bg-[#6366f1] text-black font-medium py-3 rounded-lg hover:bg-[#4f46e5] transition mt-6">
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}