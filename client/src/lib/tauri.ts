import { isTauri as isTauriRuntime } from '@tauri-apps/api/core';

export function isTauri(): boolean {
  return isTauriRuntime();
}