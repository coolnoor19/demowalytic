import React, { createContext, useContext, useState } from "react";
import { cn } from "../../lib/utils"; // adjust path if your project uses "@/lib/utils"

// Context used by components
const TabsContext = createContext(null);

/**
 * Tabs - top-level provider
 * props:
 *  - defaultValue: string (initial active tab)
 *  - value / onValueChange (optional controlled behavior)
 *  - className (optional wrapper class)
 */
export function Tabs({ defaultValue, value, onValueChange, children, className }) {
  const [internalValue, setInternalValue] = useState(defaultValue || (children && null));
  const active = value !== undefined ? value : internalValue;
  const setActive = (v) => {
    if (value === undefined) setInternalValue(v);
    if (onValueChange) onValueChange(v);
  };

  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={cn(className || "")}>{children}</div>
    </TabsContext.Provider>
  );
}

/** TabsList - container for triggers */
export function TabsList({ children, className }) {
  return <div className={cn("flex w-full", className)}>{children}</div>;
}

/** TabsTrigger - clickable tab item */
export function TabsTrigger({ value, children, className, ...props }) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("TabsTrigger must be used inside Tabs");
  const { active, setActive } = ctx;
  const isActive = active === value;

  return (
    <button
      type="button"
      data-state={isActive ? "active" : "inactive"}
      onClick={() => setActive(value)}
      className={cn(
        "flex-1 inline-flex items-center justify-center select-none focus:outline-none",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** TabsContent - render content when its value matches active */
export function TabsContent({ value, children, className }) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("TabsContent must be used inside Tabs");
  const { active } = ctx;
  if (active !== value) return null;
  return <div className={cn(className || "")}>{children}</div>;
}
