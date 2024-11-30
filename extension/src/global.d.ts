// src/global.d.ts
declare global {
  interface Window {
    chrome: typeof chrome;
  }
}

export {};
