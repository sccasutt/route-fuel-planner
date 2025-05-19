
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useWahooCallbackToasts } from "./wahooCallbackToasts";

export function useWahooCallbackNavigation() {
  const navigate = useNavigate();
  const { errorToast, successToast } = useWahooCallbackToasts();

  const navigateWithSuccess = useCallback((message: string, delay = 2000) => {
    successToast("Wahoo connected", message);
    setTimeout(() => navigate("/dashboard", { state: { wahooConnected: true } }), delay);
  }, [navigate, successToast]);

  const navigateWithError = useCallback((title: string, description: string, delay = 3000) => {
    errorToast(title, description);
    setTimeout(() => navigate("/dashboard"), delay);
  }, [navigate, errorToast]);

  const navigateToAuth = useCallback((message = "Please log in to sync your Wahoo data", delay = 2000) => {
    successToast("Wahoo connected", message);
    setTimeout(() => {
      navigate("/auth", { state: { wahooConnected: true }});
    }, delay);
  }, [navigate, successToast]);

  return {
    navigateWithSuccess,
    navigateWithError,
    navigateToAuth,
    navigate
  };
}
