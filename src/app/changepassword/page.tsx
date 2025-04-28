"use client"
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

function ChangepassInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [passwords, setPasswords] = useState({
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(true);

  useEffect(() => {
    // Check if token exists in URL
    if (!token) {
      toast.error("Invalid or missing reset token");
      // Redirect to login after a short delay
      setTimeout(() => router.push('/login'), 2000);
    }
  }, [token, router]);

  useEffect(() => {
    if (passwords.password.length > 0 && 
        passwords.confirmPassword.length > 0 && 
        passwords.password === passwords.confirmPassword) {
      setButtonDisabled(false);
    } else {
      setButtonDisabled(true);
    }
  }, [passwords]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.password !== passwords.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.post("/api/reset-password", {
        token,
        password: passwords.password
      });
      
      toast.success("Password reset successful");
      // Redirect to login page after successful reset
      setTimeout(() => router.push('/login'), 2000);
    } catch (error: any) {
      console.error("Reset failed:", error);
      toast.error(error.response?.data?.error || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="container mx-auto py-8">
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h1 className="text-2xl font-bold mb-6 text-center">
                {loading ? "Processing..." : "Reset Your Password"}
              </h1>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                    New Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={passwords.password}
                    onChange={(e) => setPasswords({...passwords, password: e.target.value})}
                    placeholder="Enter new password"
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
                    onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                    placeholder="Confirm new password"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                <div className="flex items-center justify-center">
                  <button
                    type="submit"
                    disabled={buttonDisabled || loading}
                    className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                      buttonDisabled || loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {loading ? "Processing..." : "Reset Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Changepass() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChangepassInner />
    </Suspense>
  );
}