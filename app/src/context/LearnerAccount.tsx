import { accountApi } from "../engine/accountApi";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
export type LearnerAccount = { id: string; email: string; wallets: string[] };
type AccountState = {
  learner: LearnerAccount | null;
  emailAvailable: boolean;
  localEmail: boolean;
  loaded: boolean;
  refresh: () => Promise<void>;
};
const AccountContext = createContext<AccountState>({
  learner: null,
  emailAvailable: false,
  localEmail: false,
  loaded: false,
  refresh: async () => {},
});
export function LearnerAccountProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({
    learner: null as LearnerAccount | null,
    emailAvailable: false,
    localEmail: false,
    loaded: false,
  });
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const token = ++generation.current;
    try {
      const data = await accountApi("account");
      if (token !== generation.current) return;
      setState({
        learner: data.learner ?? null,
        emailAvailable: data.emailAvailable === true,
        localEmail: data.localEmail === true,
        loaded: true,
      });
    } catch {
      if (token === generation.current)
        setState((previous) => ({ ...previous, loaded: true }));
    }
  }, []);
  // Read the browser session from the API; this state arrives asynchronously.
  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    void refresh();
  }, [refresh]);
  return (
    <AccountContext.Provider value={{ ...state, refresh }}>
      {children}
    </AccountContext.Provider>
  );
}
// A context provider and its consuming hook intentionally share this module.
// eslint-disable-next-line react/only-export-components
export function useLearnerAccount() {
  return useContext(AccountContext);
}
