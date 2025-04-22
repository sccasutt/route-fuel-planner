
import { useLocation } from "react-router-dom";

export function useWahooCallbackParams() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const code = searchParams.get("code");
  const authError = searchParams.get("error");
  const errorDesc = searchParams.get("error_description");
  const stateFromURL = searchParams.get("state");
  const urlParams = Object.fromEntries(searchParams.entries());

  return {
    code,
    authError,
    errorDesc,
    stateFromURL,
    urlParams,
  };
}
