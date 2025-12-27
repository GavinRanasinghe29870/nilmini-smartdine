"use client";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-bg-2 text-text-white">

            {/* Title */}
            <h1 className="text-big-heading font-bold mb-8 tracking-wide text-3d-purple">
                <span className="text-primary">NILMINI </span>
                <span className="text-white">SMARTDINE </span>
                <span className="text-secondary">SYSTEM</span>
            </h1>

            {/* Card */}
            <div className="w-full max-w-md bg-bg-1 rounded-2xl shadow-xl p-8">

                <h2 className="text-h1 font-semibold text-center mb-1">Login!</h2>
                <p className="text-5 text-gray-400 text-center mb-6">
                    Please enter your credentials below to continue
                </p>

                {/* Username */}
                <div className="mb-4">
                    <label className="block mb-1 text-h4">Username</label>
                    <input
                        type="text"
                        placeholder="Enter your username"
                        className="w-full px-4 py-2 rounded-md bg-[#3A3A3A] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                {/* Password */}
                <div className="mb-4">
                    <label className="block mb-1 text-h4">Password</label>
                    <input
                        type="password"
                        placeholder="Enter your password"
                        className="w-full px-4 py-2 rounded-md bg-[#3A3A3A] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                {/* Options */}
                <div className="flex items-center justify-between text-h6 mb-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="accent-primary" />
                        Remember me
                    </label>

                    <button className="text-secondary hover:underline">
                        Forgot Password?
                    </button>
                </div>

                {/* Button */}
                <button className="w-full bg-button hover:bg-primary transition-colors text-white text-h4 py-2 rounded-md font-semibold">
                    Login
                </button>
            </div>
        </div>
    );
}
