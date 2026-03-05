"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/app/src/lib/auth";
import { AxiosError } from "axios";

export default function LoginPage() {
    const router = useRouter();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit() {
        setError(null);
        setLoading(true);
        try {
            const data = await login({ identifier, password });

            if (data.user.role === "OWNER") router.push("/dashboard");
            else router.push("/dashboard");
        } catch (err) {
            const axErr = err as AxiosError<{ message?: string }>;
            setError(axErr.response?.data?.message || axErr.message || "Login failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-bg-2 text-text-white">
            <h1 className="text-big-heading font-bold mb-8 tracking-wide text-3d-purple">
                <span className="text-primary">NILMINI </span>
                <span className="text-white">SMARTDINE </span>
                <span className="text-secondary">SYSTEM</span>
            </h1>

            <div className="w-full max-w-md bg-bg-1 rounded-2xl shadow-xl p-8">
                <h2 className="text-h1 font-semibold text-center mb-1">Login!</h2>
                <p className="text-5 text-gray-400 text-center mb-6">
                    Please enter your credentials below to continue
                </p>

                {error && (
                    <div className="mb-4 rounded-md bg-red-500/20 border border-red-500/40 px-3 py-2 text-sm">
                        {error}
                    </div>
                )}

                <div className="mb-4">
                    <label className="block mb-1 text-h4">Username / Email</label>
                    <input
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        type="text"
                        placeholder="Enter your username or email"
                        className="w-full px-4 py-2 rounded-md bg-[#3A3A3A] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div className="mb-4">
                    <label className="block mb-1 text-h4">Password</label>
                    <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        placeholder="Enter your password"
                        className="w-full px-4 py-2 rounded-md bg-[#3A3A3A] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div className="flex items-center justify-between text-h6 mb-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="accent-primary" />
                        Remember me
                    </label>

                    <button className="text-secondary hover:underline" type="button">
                        Forgot Password?
                    </button>
                </div>

                <button
                    onClick={onSubmit}
                    disabled={loading}
                    className="w-full bg-button hover:bg-primary transition-colors text-white text-h4 py-2 rounded-md font-semibold disabled:opacity-60"
                >
                    {loading ? "Logging in..." : "Login"}
                </button>
            </div>
        </div>
    );
}
