/**
 * React PWA Update Prompt Component
 *
 * Shows a notification when a new version of the app is available.
 * Works with vite-plugin-pwa's virtual:pwa-register/react module.
 *
 * Usage:
 *   1. Install vite-plugin-pwa: npm i -D vite-plugin-pwa
 *   2. Configure registerType: 'prompt' in vite.config.ts
 *   3. Add <ReloadPrompt /> to your App component
 *
 * Customization:
 *   - Modify styles to match your app's design system
 *   - Adjust positioning with the .pwa-toast class
 *   - Add animations as needed
 */

import { useRegisterSW } from 'virtual:pwa-register/react';
import { useState, useEffect } from 'react';

// Styles - customize to match your design system
const styles = {
  toast: {
    position: 'fixed' as const,
    bottom: '20px',
    right: '20px',
    padding: '16px 20px',
    backgroundColor: '#1f2937',
    color: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    zIndex: 9999,
    maxWidth: '400px',
    animation: 'slideIn 0.3s ease-out',
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: 600,
    marginBottom: '4px',
    fontSize: '14px',
  },
  message: {
    fontSize: '13px',
    opacity: 0.8,
    lineHeight: 1.4,
  },
  buttons: {
    display: 'flex',
    gap: '8px',
    flexShrink: 0,
  },
  updateButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '13px',
    transition: 'background-color 0.2s',
  },
  dismissButton: {
    backgroundColor: 'transparent',
    color: '#9ca3af',
    border: '1px solid #374151',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '13px',
    transition: 'background-color 0.2s, border-color 0.2s',
  },
};

// CSS animation (add to your global styles or inject)
const keyframes = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log('SW registered:', registration);

      // Optional: Check for updates periodically
      // setInterval(() => {
      //   registration?.update();
      // }, 60 * 60 * 1000); // Check every hour
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  const [isUpdating, setIsUpdating] = useState(false);

  // Inject keyframes on mount
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateServiceWorker(true);
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  // Show nothing if no updates and not offline-ready
  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <div style={styles.toast} role="alert" aria-live="polite">
      <div style={styles.content}>
        {offlineReady ? (
          <>
            <div style={styles.title}>Ready to work offline</div>
            <div style={styles.message}>
              App has been cached for offline use.
            </div>
          </>
        ) : (
          <>
            <div style={styles.title}>Update available</div>
            <div style={styles.message}>
              A new version is ready. Reload to update.
            </div>
          </>
        )}
      </div>

      <div style={styles.buttons}>
        {needRefresh && (
          <button
            style={styles.updateButton}
            onClick={handleUpdate}
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Update'}
          </button>
        )}
        <button
          style={styles.dismissButton}
          onClick={handleDismiss}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

// Alternative: Minimal version with just the hook
export function useUpdatePrompt() {
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  return {
    offlineReady,
    needRefresh,
    update: () => updateServiceWorker(true),
  };
}

// TypeScript module declaration for virtual module
declare module 'virtual:pwa-register/react' {
  import type { Dispatch, SetStateAction } from 'react';

  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: Error) => void;
  }

  export function useRegisterSW(options?: RegisterSWOptions): {
    needRefresh: [boolean, Dispatch<SetStateAction<boolean>>];
    offlineReady: [boolean, Dispatch<SetStateAction<boolean>>];
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  };
}

export default ReloadPrompt;
