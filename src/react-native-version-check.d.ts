declare module 'react-native-version-check' {
    export function getCurrentVersion(): string;
    export function getLatestVersion(options: { provider: 'playStore' | 'appStore' }): Promise<string>;
    export function needUpdate(options: { currentVersion: string; latestVersion: string }): { isNeeded: boolean };
  }
  