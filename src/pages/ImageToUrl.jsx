import React, { useState, useEffect } from "react";
import api from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Copy, Trash2 } from "lucide-react";
import { toast } from "../hooks/use-toast";

export default function ImageToUrl() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Base URL for static file access (remove /api)
  const baseURL = api.defaults.baseURL.replace("/api", "");

  /* ---------------- Fetch All Uploaded Files ---------------- */
  const fetchFiles = async () => {
    try {
      const res = await api.get("/upload");
      setUploadedFiles(res.data.files || []);
    } catch (err) {
      console.error("❌ Failed to fetch uploaded files:", err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  /* ---------------- Handle File Upload ---------------- */
  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file before uploading.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast({ title: "✅ Uploaded", description: "File uploaded successfully!" });
      setFile(null);
      fetchFiles(); // refresh list
    } catch (err) {
      console.error("❌ Upload failed:", err);
      toast({
        title: "Error",
        description: "File upload failed. Try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  /* ---------------- Copy File URL ---------------- */
  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Copied!", description: "URL copied to clipboard." });
  };

  /* ---------------- Clear All Files ---------------- */
  const handleClear = async () => {
    if (!window.confirm("⚠️ Are you sure you want to delete all uploaded files?")) return;
    try {
      await api.delete("/upload");
      toast({ title: "🗑️ Cleared", description: "All uploaded files deleted." });
      setUploadedFiles([]);
    } catch (err) {
      console.error("❌ Failed to delete files:", err);
      toast({
        title: "Error",
        description: "Failed to clear uploaded files.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] bg-gray-50">
      <Card className="w-full max-w-2xl shadow-md border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">
            📁 File to URL Converter
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Upload any file and instantly get a public URL. Supports images, PDFs, Excel, etc.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* File Input */}
          <Input
            type="file"
            onChange={handleFileChange}
            accept="*/*"
            className="border border-gray-300 bg-white"
          />

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-green-600 text-white hover:bg-green-700"
          >
            {uploading ? "Uploading..." : "Upload & Generate URL"}
          </Button>

          {/* Uploaded Files Section */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-gray-800">
                Uploaded Files ({uploadedFiles.length})
              </h3>
              {uploadedFiles.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClear}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" /> Clear All
                </Button>
              )}
            </div>

            {uploadedFiles.length === 0 ? (
              <p className="text-sm text-gray-500">No files uploaded yet.</p>
            ) : (
              <ul className="space-y-3 max-h-[300px] overflow-y-auto border-t pt-2">
                {uploadedFiles.map((f, i) => (
                  <li
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2"
                  >
                    <div className="flex items-center gap-3">
                      {/* Preview if image */}
                      {f.url.match(/\.(png|jpg|jpeg|gif|webp)$/i) && (
                        <img
                          src={f.url}
                          alt={f.name}
                          className="w-12 h-12 object-cover rounded border"
                        />
                      )}
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 break-all hover:underline"
                      >
                        {f.url}
                      </a>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(f.url)}
                      className="flex items-center gap-1 text-sm"
                    >
                      <Copy className="h-4 w-4" /> Copy
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
