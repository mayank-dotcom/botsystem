
"use client"
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { signIn } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    if (user.email.length > 0 && user.password.length > 0) {
      setButtonDisabled(false);
    } else {
      setButtonDisabled(true);
    }
  }, [user]);

  const onLogin = async () => {
    try {
      setLoading(true);
      const response = await axios.post("/api/login", user);
      console.log("Login success", response.data);
      toast.success("Login successful");
      router.push("/admin");
    } catch (error: any) {
      console.log("Login failed", error.response?.data);
      toast.error(error.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      setLoading(true);
      const response = await axios.post("/api/forgot-password", { email: resetEmail });
      toast.success("Password reset email sent");
      setShowForgotPassword(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/admin" });
  };

  const handleGithubSignIn = () => {
    signIn("github", { callbackUrl: "/admin" });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2 bg-gray-50">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {loading ? "Processing..." : "Login"}
        </h1>
        
        {!showForgotPassword ? (
          <>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                placeholder="Email"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={user.password}
                onChange={(e) => setUser({ ...user, password: e.target.value })}
                placeholder="Password"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={onLogin}
                disabled={buttonDisabled || loading}
                className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                  buttonDisabled || loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setShowForgotPassword(true)}
                className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
              >
                Forgot Password?
              </button>
            </div>
           
            <p className="text-center text-gray-600 text-sm">
              Don't have an account?{" "}
              <Link href="/signup" className="text-blue-500 hover:text-blue-800">
                Sign up
              </Link>
            </p>
          </>
        ) : (
          <>
            <div className="mb-4">
              <label htmlFor="resetEmail" className="block text-gray-700 text-sm font-bold mb-2">
                Email
              </label>
              <input
                id="resetEmail"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handleForgotPassword}
                disabled={!resetEmail || loading}
                className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                  !resetEmail || loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Send Reset Link
              </button>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
              >
                Back to Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}