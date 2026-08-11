"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, X, Copy, Check } from "lucide-react";
import { forgotPassword, login } from "@/app/src/lib/auth";
import { AxiosError } from "axios";

type UserRole = "OWNER" | "MANAGER" | "CASHIER" | "WAITER" | "STAFF";

type PopupType = "success" | "error";

type PopupState = {
  type: PopupType;
  title: string;
  message: string;
  temporaryPassword?: string;
} | null;

function getRedirectPath(role?: string) {
  const normalizedRole = String(role || "").toUpperCase() as UserRole;

  if (normalizedRole === "CASHIER") {
    return "/billing";
  }

  return "/dashboard";
}

function getFriendlyErrorMessage(error: unknown) {
  const axErr = error as AxiosError<{ message?: string }>;

  const status = axErr.response?.status;
  const apiMessage = axErr.response?.data?.message;

  if (status === 400) {
    return apiMessage || "Please enter the required details correctly.";
  }

  if (status === 401) {
    return "Username/email or password is incorrect. Please check and try again.";
  }

  if (status === 403) {
    return "You do not have permission to access this system.";
  }

  if (status === 404) {
    return apiMessage || "No matching user account was found.";
  }

  if (status && status >= 500) {
    return "Server error occurred. Please try again later.";
  }

  if (apiMessage) {
    return apiMessage;
  }

  if (axErr.code === "ERR_NETWORK") {
    return "Cannot connect to the server. Please check whether the backend is running.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Request failed. Please try again.";
}

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotUsername, setForgotUsername] = useState("");

  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [popup, setPopup] = useState<PopupState>(null);
  const [copied, setCopied] = useState(false);

  function showPopup(
    type: PopupType,
    title: string,
    message: string,
    temporaryPassword?: string
  ) {
    setCopied(false);
    setPopup({
      type,
      title,
      message,
      temporaryPassword,
    });
  }

  function closeMainPopup() {
    setCopied(false);
    setPopup(null);
  }

  function closeForgotPopup() {
    if (forgotLoading) return;

    setForgotOpen(false);
    setForgotEmail("");
    setForgotPhone("");
    setForgotUsername("");
  }

  async function copyTemporaryPassword(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanIdentifier = identifier.trim();

    if (!cleanIdentifier || !password.trim()) {
      showPopup(
        "error",
        "Missing login details",
        "Please enter your username/email and password before logging in."
      );
      return;
    }

    try {
      setLoading(true);
      setPopup(null);

      const data = await login({
        identifier: cleanIdentifier,
        password,
      });

      const role = data?.user?.role;

      if (!role) {
        throw new Error("Login successful, but user role was not received.");
      }

      const redirectPath = getRedirectPath(role);

      showPopup(
        "success",
        "Login successful",
        role === "CASHIER"
          ? "Welcome cashier. Redirecting you to the billing page."
          : "Welcome back. Redirecting you to the dashboard."
      );

      setTimeout(() => {
        router.replace(redirectPath);
      }, 900);
    } catch (err) {
      showPopup("error", "Login failed", getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function onForgotPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanEmail = forgotEmail.trim();
    const cleanPhone = forgotPhone.trim();
    const cleanUsername = forgotUsername.trim();

    if (!cleanEmail || !cleanPhone || !cleanUsername) {
      showPopup(
        "error",
        "Missing details",
        "Please enter the email, phone number, and username of the user account."
      );
      return;
    }

    try {
      setForgotLoading(true);
      setPopup(null);

      const data = await forgotPassword({
        email: cleanEmail,
        phone: cleanPhone,
        username: cleanUsername,
      });

      closeForgotPopup();

      showPopup(
        "success",
        "Temporary password created",
        data.message,
        data.temporaryPassword
      );
    } catch (err) {
      showPopup("error", "Password reset failed", getFriendlyErrorMessage(err));
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-bg-2 text-text-white px-4">
      {popup && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/40 px-4 pt-8">
          <div
            className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl ${popup.type === "success"
                ? "border-green-500/40 bg-[#122417] text-green-100"
                : "border-red-500/40 bg-[#2A1111] text-red-100"
              }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`mt-1 rounded-full p-2 ${popup.type === "success"
                    ? "bg-green-500/20 text-green-300"
                    : "bg-red-500/20 text-red-300"
                  }`}
              >
                {popup.type === "success" ? (
                  <CheckCircle2 size={26} />
                ) : (
                  <XCircle size={26} />
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold">{popup.title}</h3>

                <p className="mt-1 text-sm leading-6 opacity-90">
                  {popup.message}
                </p>

                {popup.temporaryPassword && (
                  <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3">
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-green-200/80">
                      Temporary Password
                    </label>

                    <div className="flex gap-2">
                      <input
                        value={popup.temporaryPassword}
                        readOnly
                        className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white outline-none"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          copyTemporaryPassword(popup.temporaryPassword || "")
                        }
                        className="inline-flex items-center gap-2 rounded-md bg-button px-3 py-2 text-sm font-semibold text-white hover:bg-primary"
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-green-100/75">
                      Copy this password and use it to login. After login, the
                      user can change the password from Staff Management.
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={closeMainPopup}
                className="rounded-full p-1 hover:bg-white/10"
                aria-label="Close popup"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {forgotOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-primary/30 bg-bg-1 p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-white">
                  Forgot Password
                </h3>

                <p className="mt-1 text-sm leading-6 text-gray-400">
                  Enter the saved staff account details. The system will verify
                  the account and generate a temporary password.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForgotPopup}
                disabled={forgotLoading}
                className="rounded-full p-1 text-gray-300 hover:bg-white/10 disabled:opacity-60"
                aria-label="Close forgot password popup"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={onForgotPasswordSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-200">
                  Email
                </label>

                <input
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  type="email"
                  placeholder="Enter user email"
                  disabled={forgotLoading}
                  className="w-full rounded-md bg-[#3A3A3A] px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-200">
                  Phone Number
                </label>

                <input
                  value={forgotPhone}
                  onChange={(e) => setForgotPhone(e.target.value)}
                  type="tel"
                  placeholder="Enter saved phone number"
                  disabled={forgotLoading}
                  className="w-full rounded-md bg-[#3A3A3A] px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-200">
                  Username
                </label>

                <input
                  value={forgotUsername}
                  onChange={(e) => setForgotUsername(e.target.value)}
                  type="text"
                  placeholder="Enter username"
                  disabled={forgotLoading}
                  className="w-full rounded-md bg-[#3A3A3A] px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full rounded-md bg-button py-2 text-h4 font-semibold text-white transition-colors hover:bg-primary disabled:opacity-60"
              >
                {forgotLoading
                  ? "Checking account..."
                  : "Create Temporary Password"}
              </button>
            </form>
          </div>
        </div>
      )}

      <h1 className="text-big-heading font-bold mb-8 tracking-wide text-3d-purple text-center">
        <span className="text-primary">NILMINI </span>
        <span className="text-white">SMARTDINE </span>
        <span className="text-secondary">SYSTEM</span>
      </h1>

      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-bg-1 rounded-2xl shadow-xl p-8"
      >
        <h2 className="text-h1 font-semibold text-center mb-1">Login!</h2>

        <p className="text-5 text-gray-400 text-center mb-6">
          Please enter your credentials below to continue
        </p>

        <div className="mb-4">
          <label className="block mb-1 text-h4">Username / Email</label>

          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            type="text"
            placeholder="Enter your username or email"
            disabled={loading}
            className="w-full px-4 py-2 rounded-md bg-[#3A3A3A] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-h4">Password</label>

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Enter your password"
            disabled={loading}
            className="w-full px-4 py-2 rounded-md bg-[#3A3A3A] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
          />
        </div>

        <div className="mb-6 flex justify-end text-h6">
          <button
            className="text-secondary hover:underline disabled:opacity-60"
            type="button"
            disabled={loading}
            onClick={() => {
              setPopup(null);
              setForgotOpen(true);
            }}
          >
            Forgot Password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-button hover:bg-primary transition-colors text-white text-h4 py-2 rounded-md font-semibold disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => router.push("/")}
          className="mt-3 w-full rounded-md border border-white/15 bg-white/5 py-1.5 text-sm font-medium text-gray-200 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60"
        >
          Back
        </button>
      </form>
    </div>
  );
}