
export type NavigateFunction = (to: string, options?: { replace?: boolean; state?: any }) => void;

let navigate: NavigateFunction | null = null;

export const setNavigate = (navFn: NavigateFunction) => {
  navigate = navFn;
};

export const navigateTo: NavigateFunction = (to, options) => {
  if (navigate) {
    navigate(to, options);
  } else {
    window.location.href = to;
  }
};