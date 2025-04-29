"use client"
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import "./style.css";
import { signIn } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";

export default function SignupPage() {
  const router = useRouter();
  const [user, setUser] = useState({
    username: "",
    email: "",
    password: "",
    org_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(true);

  useEffect(() => {
    if (
      user.email.length > 0 &&
      user.password.length > 0 &&
      user.username.length > 0 &&
      user.org_name.length > 0
    ) {
      setButtonDisabled(false);
    } else {
      setButtonDisabled(true);
    }
  }, [user]);

  const onSignup = async () => {
    try {
      setLoading(true);
      const response = await axios.post("/api/signin", user);
      console.log("Signup success", response.data);
      toast.success("Signup successful! Please check your email for verification.");
      router.push("/login");
    } catch (error: any) {
      console.log("Signup failed", error.response?.data);
      toast.error(error.response?.data?.message || "Signup failed");
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
    <div className="flex min-h-screen flex-col items-center justify-center py-2 bg-gray-50" id="sign-cont">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {loading ? "Processing..." : "Sign Up"}
        </h1>
        
        <div className="mb-4">
          <label htmlFor="org_name" className="block text-gray-700 text-sm font-bold mb-2">
            Organization Name
          </label>
          <input
            id="org_name"
            type="text"
            value={user.org_name}
            onChange={(e) => setUser({ ...user, org_name: e.target.value })}
            placeholder="Organization Name"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={user.username}
            onChange={(e) => setUser({ ...user, username: e.target.value })}
            placeholder="Username"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        
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
        
        <div className="flex items-center justify-center mb-6">
          <button
            onClick={onSignup}
            disabled={buttonDisabled || loading}
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              buttonDisabled || loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Sign Up
          </button>
        </div>
        
   
        
        <p className="text-center text-gray-600 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-500 hover:text-blue-800">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}