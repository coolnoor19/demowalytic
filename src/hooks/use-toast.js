// Compatibility wrapper: delegates to Sonner toast
// Existing code can keep using toast({ title, description, variant }) pattern
import { toast as sonnerToast } from "sonner";

function toast(props) {
  if (typeof props === "string") {
    sonnerToast(props);
    return;
  }

  const { title, description, variant } = props || {};
  const message = title || description || "";
  const opts = description && title ? { description } : undefined;

  if (variant === "destructive") {
    sonnerToast.error(message, opts);
  } else {
    sonnerToast.success(message, opts);
  }
}

// Attach .error / .success for direct usage
toast.error = (msg, opts) => sonnerToast.error(msg, opts);
toast.success = (msg, opts) => sonnerToast.success(msg, opts);

function useToast() {
  return { toast };
}

export { useToast, toast };
