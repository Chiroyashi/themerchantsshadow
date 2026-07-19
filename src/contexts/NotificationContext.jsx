import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Z_LAYER } from '../constants/zIndex';
import { lockScroll, unlockScroll } from '../utils/scrollLock';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState({
    show: false, title: "", message: "", type: "info", onConfirm: null
  });

  const showNotif = useCallback((title, message, type = "info", onConfirm = null) => {
    setNotification({ show: true, title, message, type, onConfirm });
  }, []);

  const closeNotif = useCallback(() => {
    setNotification(prev => ({ ...prev, show: false }));
  }, []);

  return (
    <NotificationContext.Provider value={{ notification, showNotif, closeNotif }}>
      {children}

      {/* Modal Notifikasi Global */}
      {notification.show && (
        <OverlayWrapper>
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center space-y-6">
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">{notification.title}</h2>
            <p className="text-slate-400 text-sm leading-relaxed">{notification.message}</p>
            <div className="flex gap-2">
              <button
                onClick={closeNotif}
                className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-2xl font-bold uppercase text-[10px]"
              >
                {notification.type === "confirm" ? "Batal" : "Tutup"}
              </button>
              {notification.type === "confirm" && (
                <button
                  onClick={() => { notification.onConfirm?.(); closeNotif(); }}
                  className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-bold uppercase text-[10px]"
                >
                  Lanjut
                </button>
              )}
            </div>
          </div>
        </OverlayWrapper>
      )}
    </NotificationContext.Provider>
  );
}

function OverlayWrapper({ children }) {
  useEffect(() => { lockScroll(); return unlockScroll; }, []);
  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      style={{ zIndex: Z_LAYER.NOTIFICATION }}
    >
      {children}
    </div>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
