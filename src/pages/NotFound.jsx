import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center">
      <h1 className="text-6xl font-bold text-gray-800">404</h1>
      <p className="text-gray-600 mt-4 text-lg">Page not found</p>
      <p className="text-gray-600 mt-4 text-lg">Login first</p>
      <Link
        to="/"
        className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Go To Login
      </Link>
    </div>
  );
}
