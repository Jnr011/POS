import { useState, useEffect, useCallback } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { invoke } from '@tauri-apps/api/core';

interface UpdateInfo {
  available: boolean;
  version?: string;
  body?: string;
}

export function useUpdate() {
  const [info, setInfo] = useState<UpdateInfo>({ available: false });
  const [checking, setChecking] = useState(false);
  const [installing, setInstalling] = useState(false);

  const checkUpdate = useCallback(async () => {
    setChecking(true);
    try {
      const u = await check();
      if (u?.available) {
        setInfo({ available: true, version: u.version, body: u.body });
      }
    } catch {
      // silent — offline or not Tauri runtime
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkUpdate();

    const interval = setInterval(checkUpdate, 1000 * 60 * 60 * 6); // every 6h
    return () => clearInterval(interval);
  }, [checkUpdate]);

  const install = useCallback(async () => {
    setInstalling(true);
    try {
      const u = await check();
      if (u?.available) {
        await u.downloadAndInstall();
        // exit before installer runs to avoid tray-lock
        await invoke('exit_app');
      }
    } finally {
      setInstalling(false);
    }
  }, []);

  return { ...info, checking, installing, checkUpdate, install };
}
