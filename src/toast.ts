import { createContext, useContext } from 'react';

export type ToastType = 'success' | 'error' | 'info';

/** A single action offered alongside the message, e.g. undoing what it reports. */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  action?: ToastAction;
}

export interface ToastContextValue {
  addToast: (message: string, type?: ToastType, action?: ToastAction) => void;
}

export const ToastContext = createContext<ToastContextValue>({ addToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}
