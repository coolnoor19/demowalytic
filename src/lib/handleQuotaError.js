// src/utils/handleQuotaError.js
export default function handleQuotaError(error, toast, navigate) {
  if (error?.response?.data?.reason?.endsWith("_exceeded")) {
    const reason = error.response.data.reason;
    const feature = reason.replace("_exceeded", "");

    toast({
      title: `${feature} limit reached`,
      description: `Upgrade your plan to get more ${feature}.`,
      variant: "destructive",
    });

    if (navigate) {
      navigate("/pricing");
    }
    return true;
  }

  // Fallback: generic error message
  if (error?.response?.data?.message) {
    toast({
      title: "Error",
      description: error.response.data.message,
      variant: "destructive",
    });
  }

  return false;
}
