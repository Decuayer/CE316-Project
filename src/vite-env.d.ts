/// <reference types="vite/client" />

import type { ApiType } from '../electron/preload';

declare global {
  interface Window {
    api: ApiType;
  }
}
