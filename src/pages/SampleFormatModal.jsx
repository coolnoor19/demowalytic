import React from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";

export default function SampleFormatModal({ open, onClose }) {
  const sampleData = [
    {
      To: "919876543210",
      Message: "This is a *test msg* from _YourApp_",
      "Image/File Url (Optional)": "",
      whatsapp_client_id: 0,
      "Schedule Time (Optional)": "2024-12-25T14:30:00+05:30",
    },
    {
      To: "Family Group",
      Message: "Happy holidays everyone! 🎉",
      "Image/File Url (Optional)": "",
      whatsapp_client_id: 1,
      "Schedule Time (Optional)": "2024-12-25T16:00:00+05:30",
    },
    {
      To: "919812345678",
      Message: "Welcome! Check our offers",
      "Image/File Url (Optional)": "https://example.com/image.jpg",
      whatsapp_client_id: 1,
      "Schedule Time (Optional)": "2024-12-26T10:30:00+05:30",
    },
  ];

  const downloadSampleExcel = () => {
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sample");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([excelBuffer]), "sample-format.xlsx");
  };

  const downloadSampleCSV = () => {
    const header = Object.keys(sampleData[0]);
    const rows = sampleData.map((row) => header.map((key) => row[key]));
    const csvContent = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "sample-format.csv");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-white rounded-xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            📄 Sample File Format
          </DialogTitle>
        </DialogHeader>

        {/* Download Buttons */}
        <div className="flex flex-wrap gap-3 mb-4">
          <Button
            onClick={downloadSampleExcel}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            ⬇️ Sample Excel Format
          </Button>
          <Button
            onClick={downloadSampleCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            ⬇️ Sample CSV Format
          </Button>
        </div>

        {/* Table Preview */}
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">To</th>
                <th className="border p-2">Message</th>
                <th className="border p-2">Image/File Url (Optional)</th>
                <th className="border p-2">whatsapp_client_id</th>
                <th className="border p-2">Schedule Time (Optional)</th>
              </tr>
            </thead>
            <tbody>
              {sampleData.map((row, idx) => (
                <tr key={idx} className="odd:bg-white even:bg-gray-50">
                  <td className="border p-2">{row.To}</td>
                  <td className="border p-2">{row.Message}</td>
                  <td className="border p-2">
                    {row["Image/File Url (Optional)"]}
                  </td>
                  <td className="border p-2">{row.whatsapp_client_id}</td>
                  <td className="border p-2">
                    {row["Schedule Time (Optional)"]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Info Section */}
        <div className="mt-5 text-sm text-gray-700 space-y-3">
          <div>
            <h3 className="font-semibold">📌 To Column Guide:</h3>
            <ul className="list-disc list-inside text-gray-600">
              <li>
                <b>Phone Number:</b> Add country code prefix (e.g.{" "}
                <code>919876543210</code>)
              </li>
              <li>
                <b>Group Name:</b> Enter the exact group name (e.g.{" "}
                <code>Family Group</code>)
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">📌 WhatsApp Client ID Guide:</h3>
            <ul className="list-disc list-inside text-gray-600">
              <li>
                Use <code>whatsapp_client_id</code> to specify which WhatsApp
                account to send from.
              </li>
              <li>
                If you have only one account, keep it <code>0</code>.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">📌 Schedule Time Format:</h3>
            <ul className="list-disc list-inside text-gray-600">
              <li>
                Example: <code>2024-12-25T14:30:00+05:30</code> (ISO format with
                timezone)
              </li>
              <li>Leave empty to send immediately.</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
