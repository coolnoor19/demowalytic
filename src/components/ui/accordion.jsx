import * as React from "react";

export function Accordion({ children, className }) {
  return (
    <div className={`space-y-2 ${className || ""}`}>
      {children}
    </div>
  );
}

export function AccordionItem({ value, children }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="border rounded-md">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2 font-medium hover:bg-gray-50"
      >
        {value}
        <span>{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-4 py-2 text-sm text-gray-600">{children}</div>}
    </div>
  );
}
