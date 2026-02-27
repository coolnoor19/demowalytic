import React, { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";

export function Dropdown({ label, items }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="px-4 py-2 bg-gray-100 rounded-md text-sm font-medium hover:bg-gray-200"
      >
        {label}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-md border z-50">
          {items.map((item, i) => (
            <button
              key={i}
              className={cn(
                "w-full text-left px-4 py-2 text-sm hover:bg-gray-100",
                item.danger && "text-red-600"
              )}
              onClick={() => {
                item.onClick?.();
                setOpen(false); // close when an item is clicked
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
