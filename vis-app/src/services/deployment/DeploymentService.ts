/**
 * DeploymentService
 *
 * Persists the active inspection recipe to localStorage so it survives
 * page refreshes and is available to the Run window without any manual
 * file loading by the operator.
 *
 * Only ONE deployment is active at a time.  Saving a new deployment
 * automatically replaces the previous one.
 *
 * ELECTRON IPC HOOK (M3):
 *   Replace localStorage calls with:
 *     window.electronAPI.deployment.save(deployment)
 *     window.electronAPI.deployment.load()
 */

import type { MeasurementRecord } from '@/types';

export interface ActiveDeployment {
  /** Monotonically incrementing version, e.g. "1.0.1753456789012" */
  version: string;
  /** ISO timestamp of when Save & Deploy was clicked. */
  deployedAt: string;
  /** Human-readable name for the recipe. */
  deploymentName: string;
  /** The ordered list of configured measurements. */
  measurements: MeasurementRecord[];
}

const STORAGE_KEY = 'mvs-active-deployment';

export const DeploymentService = {
  /**
   * Persist the inspection recipe as the currently active deployment.
   * Replaces any previous deployment immediately.
   */
  save(deployment: ActiveDeployment): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deployment));
    } catch (e) {
      console.error('[DeploymentService] Failed to save deployment', e);
    }
  },

  /**
   * Load the currently active deployment.
   * Returns null if nothing has been deployed yet.
   */
  load(): ActiveDeployment | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as ActiveDeployment;
    } catch (e) {
      console.error('[DeploymentService] Failed to load deployment', e);
      return null;
    }
  },

  /** True when a valid deployment is stored. */
  isDeployed(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  },

  /** Remove the active deployment. */
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  /** Return the version string of the active deployment, or null. */
  getVersion(): string | null {
    return DeploymentService.load()?.version ?? null;
  },
};
