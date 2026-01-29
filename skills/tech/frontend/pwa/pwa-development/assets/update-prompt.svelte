<!--
  Svelte PWA Update Prompt Component

  Shows a notification when a new version of the app is available.
  Works with @vite-pwa/sveltekit's virtual:pwa-register/svelte module.

  Usage:
    1. Install @vite-pwa/sveltekit: npm i -D @vite-pwa/sveltekit
    2. Configure registerType: 'prompt' in vite.config.ts
    3. Add <ReloadPrompt /> to your +layout.svelte

  Customization:
    - Modify styles to match your app's design system
    - Adjust positioning with the .pwa-toast class
    - Add transitions as needed
-->

<script lang="ts">
  import { useRegisterSW } from 'virtual:pwa-register/svelte';
  import { fly } from 'svelte/transition';

  const {
    needRefresh,
    offlineReady,
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

  let isUpdating = false;

  async function handleUpdate() {
    isUpdating = true;
    try {
      await updateServiceWorker(true);
    } catch (error) {
      console.error('Update failed:', error);
      isUpdating = false;
    }
  }

  function handleDismiss() {
    offlineReady.set(false);
    needRefresh.set(false);
  }
</script>

{#if $offlineReady || $needRefresh}
  <div
    class="pwa-toast"
    role="alert"
    aria-live="polite"
    transition:fly={{ x: 100, duration: 300 }}
  >
    <div class="content">
      {#if $offlineReady}
        <div class="title">Ready to work offline</div>
        <div class="message">
          App has been cached for offline use.
        </div>
      {:else}
        <div class="title">Update available</div>
        <div class="message">
          A new version is ready. Reload to update.
        </div>
      {/if}
    </div>

    <div class="buttons">
      {#if $needRefresh}
        <button
          class="update-button"
          on:click={handleUpdate}
          disabled={isUpdating}
        >
          {isUpdating ? 'Updating...' : 'Update'}
        </button>
      {/if}
      <button
        class="dismiss-button"
        on:click={handleDismiss}
      >
        Dismiss
      </button>
    </div>
  </div>
{/if}

<style>
  .pwa-toast {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 16px 20px;
    background-color: #1f2937;
    color: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    gap: 16px;
    z-index: 9999;
    max-width: 400px;
  }

  .content {
    flex: 1;
  }

  .title {
    font-weight: 600;
    margin-bottom: 4px;
    font-size: 14px;
  }

  .message {
    font-size: 13px;
    opacity: 0.8;
    line-height: 1.4;
  }

  .buttons {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .update-button {
    background-color: #3b82f6;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    font-size: 13px;
    transition: background-color 0.2s;
  }

  .update-button:hover:not(:disabled) {
    background-color: #2563eb;
  }

  .update-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .dismiss-button {
    background-color: transparent;
    color: #9ca3af;
    border: 1px solid #374151;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    font-size: 13px;
    transition: background-color 0.2s, border-color 0.2s;
  }

  .dismiss-button:hover {
    background-color: #374151;
    border-color: #4b5563;
  }

  /* Responsive adjustments */
  @media (max-width: 480px) {
    .pwa-toast {
      left: 20px;
      right: 20px;
      bottom: 10px;
      flex-direction: column;
      text-align: center;
    }

    .buttons {
      width: 100%;
      justify-content: center;
    }
  }
</style>

<!--
  TypeScript declaration for virtual module
  Add this to src/app.d.ts or a .d.ts file:

  declare module 'virtual:pwa-register/svelte' {
    import type { Writable } from 'svelte/store';

    export interface RegisterSWOptions {
      immediate?: boolean;
      onNeedRefresh?: () => void;
      onOfflineReady?: () => void;
      onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
      onRegisterError?: (error: Error) => void;
    }

    export function useRegisterSW(options?: RegisterSWOptions): {
      needRefresh: Writable<boolean>;
      offlineReady: Writable<boolean>;
      updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
    };
  }
-->
