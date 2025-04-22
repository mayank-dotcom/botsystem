"use client"
import axios, { AxiosError } from "axios";
import React, { useState } from "react";
import Link from "next/link";
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import "./pdf.css";

const PdfEmbeddingForm: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setFile(selectedFile || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a PDF file");
      return;
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError("Please upload a PDF file");
      return;
    }

    setLoading(true);
    setResponse(null);
    setError(null);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const res = await axios.post("/api/chunks_pdf", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResponse(res.data.message);
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string; details?: string }>;
      setError(
        axiosError.response?.data.details ||
        axiosError.response?.data.error ||
        "An error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6" id="pdf_cont">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">PDF Embeddings</h1>
      </div>
      
      <div className="bg-white shadow rounded-lg" id='pdf-upload'>
        <div className="p-4 border-b">
          <span><h2 className="text-lg font-medium">Upload PDF Documents</h2></span>
          <span>
            <button
              id='pdf_button'
              type="button"
              onClick={handleSubmit}
              disabled={loading || !file}
              className="w-1/2 px-4 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              {loading ? "Processing..." : "Generate Embeddings"}
            </button>
          </span>
        </div>
        
        <div className="p-4">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <DocumentArrowUpIcon className="w-8 h-8 mb-4 text-gray-500" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PDF files only</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={loading}
              />
            </label>
          </div>
        </div>
      </div>
      
      {response && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
          {response}
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      
      <div
        id="back_b2"
        className="flex justify-center items-center w-14 h-14 rounded-full bg-indigo-300 transition-all duration-300 absolute top-4 left-4 text-white"
      >
        <Link href="/" id="fic" className="text-black font-bold text-xl">
          <i className="fa-solid fa-arrow-left"></i>
        </Link>
      </div>
    </div>
  );
};

export default PdfEmbeddingForm;