import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes conditionally
 * @param  {...any} inputs - class names or conditional className objects
 * @returns {string} merged className string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
