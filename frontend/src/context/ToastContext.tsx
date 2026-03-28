import { createContext } from 'react';
import type { ToastContextType } from './ToastType';

export const ToastContext = createContext<ToastContextType | null>(null);