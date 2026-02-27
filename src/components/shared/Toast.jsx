import { toast } from "sonner";

export const showSuccess = (msg) => toast.success(msg);
export const showError = (msg) => toast.error(msg);
