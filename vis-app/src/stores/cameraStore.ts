import { create } from 'zustand';
import type { CameraFrame, CameraDevice, CameraStatus, CameraResolution } from '@/services/camera';

interface CameraStoreState {
  stream: MediaStream | null;
  videoElement: HTMLVideoElement | null;
  status: CameraStatus;
  currentFrame: CameraFrame | null;
  fps: number;
  resolution: CameraResolution;
  isRunning: boolean;
  lastError: string | null;
  cameraDevices: CameraDevice[];
  selectedDeviceId: string | null;
  frameCount: number;
  timestamp?: string;
  setStatus: (status: CameraStatus) => void;
  setStream: (stream: MediaStream | null) => void;
  setVideoElement: (videoElement: HTMLVideoElement | null) => void;
  setCurrentFrame: (frame: CameraFrame | null) => void;
  setFps: (fps: number) => void;
  setResolution: (width: number, height: number) => void;
  setCameraDevices: (devices: CameraDevice[]) => void;
  setSelectedDeviceId: (deviceId: string | null) => void;
  setLastError: (error: string | null) => void;
  incrementFrame: () => void;
  reset: () => void;
}

const defaults = {
  stream: null,
  videoElement: null,
  status: 'offline' as CameraStatus,
  currentFrame: null,
  fps: 0,
  resolution: { width: 1920, height: 1080 } as CameraResolution,
  isRunning: false,
  lastError: null,
  cameraDevices: [] as CameraDevice[],
  selectedDeviceId: null,
  frameCount: 0,
  timestamp: undefined as string | undefined,
};

export const useCameraStore = create<CameraStoreState>((set) => ({
  ...defaults,

  setStatus: (status) => set({ status }),
  setStream: (stream) => set({ stream }),
  setVideoElement: (videoElement) => set({ videoElement }),
  setCurrentFrame: (currentFrame) => set({ currentFrame }),
  setFps: (fps) => set({ fps }),
  setResolution: (width, height) => set({ resolution: { width, height } }),
  setCameraDevices: (cameraDevices) => set({ cameraDevices }),
  setSelectedDeviceId: (selectedDeviceId) => set({ selectedDeviceId }),
  setLastError: (lastError) => set({ lastError }),
  incrementFrame: () => set((state) => ({ frameCount: state.frameCount + 1, timestamp: new Date().toISOString() })),
  reset: () => set({ ...defaults }),
}));

