export type ToastType = 'SUCCESS' | 'ERROR' | 'SYSTEM';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export interface ToastContextType {
  notify: (message: string, type?: ToastType) => void;
}