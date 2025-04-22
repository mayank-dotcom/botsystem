"use client"
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

export default function VerifiedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        if (!token) {
          setError("No verification token found");
          setLoading(false);
          return;
        }

        const response = await axios.post("/api/verify-email", { token });
        setVerified(true);
      } catch (error: any) {
        console.error("Verification failed:", error);
        setError(error.response?.data?.error || "Failed to verify email");
        toast.error("Email verification failed");
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2 bg-gray-50">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="bg-white p-8 rounded-lg shadow-md w-96 text-center">
        {loading ? (
          <h1 className="text-2xl font-bold mb-6">Verifying your email...</h1>
        ) : verified ? (
          <>
            <h1 className="text-2xl font-bold mb-6 text-green-600">Email Verified!</h1>
            <p className="mb-6">Your email has been successfully verified.</p>
            <Link 
              href="/login" 
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Go to Login
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-6 text-red-600">Verification Failed</h1>
            <p className="mb-6">{error || "There was a problem verifying your email."}</p>
            <Link 
              href="/login" 
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Go to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}