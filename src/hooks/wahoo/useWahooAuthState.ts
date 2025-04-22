
import { validateWahooAuthState } from "./validateWahooAuthState";

export function useWahooAuthState() {
  const validateState = (stateFromURL: string | null, storedStateJSON: string | null) => {
    console.log("Validating Wahoo auth state");
    return validateWahooAuthState(stateFromURL, storedStateJSON);
  };

  const createNewState = () => {
    const stateArray = new Uint8Array(16);
    window.crypto.getRandomValues(stateArray);
    const state = Array.from(stateArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const stateData = {
      value: state,
      created: Date.now()
    };
    
    localStorage.setItem("wahoo_auth_state", JSON.stringify(stateData));
    return state;
  };

  const clearState = () => {
    localStorage.removeItem("wahoo_auth_state");
  };

  return {
    validateState,
    createNewState,
    clearState
  };
}
