import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View } from 'react-native';
import { Toast, ToastType } from '../components/Toast';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const hideToast = useCallback(() => {
    setVisible(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  const showToast = useCallback((msg: string, t: ToastType = 'info') => {
    // If already showing, hide first to re-trigger animation if possible, 
    // or just update message. Re-triggering is better for user feedback.
    setVisible(false);
    
    setTimeout(() => {
      setMessage(msg);
      setType(t);
      setVisible(true);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setVisible(false);
      }, 3000); // 3 seconds timeout
    }, 10);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast 
        visible={visible} 
        message={message} 
        type={type} 
        onHide={hideToast} 
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
