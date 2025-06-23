// src/app/services/storage.service.ts

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private tokenKey = 'token';

  isChrome(): boolean {
    return typeof chrome !== 'undefined' && !!chrome.storage?.local;
  }

  get(key: string): Promise<string | null> {
    if (this.isChrome()) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
          resolve(result[key] ?? null);
        });
      });
    } else {
      const val = localStorage.getItem(key);
      return Promise.resolve(val);
    }
  }

  set(key: string, value: string): Promise<void> {
    if (this.isChrome()) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, () => resolve());
      });
    } else {
      localStorage.setItem(key, value);
      return Promise.resolve();
    }
  }

  remove(key: string): Promise<void> {
    if (this.isChrome()) {
      return new Promise((resolve) => {
        chrome.storage.local.remove(key, () => resolve());
      });
    } else {
      localStorage.removeItem(key);
      return Promise.resolve();
    }
  }
}
