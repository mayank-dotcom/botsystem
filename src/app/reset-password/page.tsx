"use client"
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [passwords, setPasswords] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(true);

  useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing token");
      router.push("/login");
    }
  }, [token, router]);

  useEffect(() => {
    if (
      passwords.password.length > 0 &&
      passwords.confirmPassword.length > 0 &&
      passwords.password === passwords.confirmPassword
    ) {
      setButtonDisabled(false);
    } else {
      setButtonDisabled(true);
    }
  }, [passwords]);

  const resetPassword = async () => {
    try {
      setLoading(true);
      const response = await axios.post("/api/reset-password", {
        token,
        password: passwords.password,
      });
      
      toast.success("Password reset successful");
      router.push("/login");
    } catch (error: any) {
      console.error("Reset password failed:", error);
      toast.error(error.response?.data?.error || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2 bg-gray-50">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {loading ? "Processing..." : "Reset Password"}
        </h1>
        
        <div className="mb-4">
          <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
            New Password
          </label>
          <input
            id="password"
            type="password"
            value={passwords.password}
            onChange={(e) => setPasswords({ ...passwords, password: e.target.value })}
            placeholder="New Password"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={passwords.confirmPassword}
            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
            placeholder="Confirm Password"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          {passwords.password !== passwords.confirmPassword && passwords.confirmPassword.length > 0 && (
            <p className="text-red-500 text-xs italic mt-1">Passwords do not match</p>
          )}
        </div>
        
        <div className="flex items-center justify-center">
          <button
            onClick={resetPassword}
            disabled={buttonDisabled || loading}
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              buttonDisabled || loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Reset Password
          </button>
        </div>
      </div>
    </div>
  );
}