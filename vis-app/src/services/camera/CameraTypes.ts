export type CameraStatus = 'idle' | 'requesting' | 'live' | 'capturing' | 'stopped' | 'error' | 'offline';

export interface CameraResolution {
  width: number;
  height: number;
}

export interface CameraDevice {
  deviceId: string;
  label: string;
}

export interface CameraFrame {
  dataUrl: string;
  width: number;
  height: number;
  timestamp: string;
}

export interface CameraStateSnapshot {
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
}

export interface ICameraService {
  startCamera(options?: { deviceId?: string; videoElement?: HTMLVideoElement | null }): Promise<void>;
  stopCamera(): Promise<void>;
  captureFrame(): Promise<CameraFrame | null>;
  resumePreview(): Promise<void>;
  getCurrentFrame(): CameraFrame | null;
  isRunning(): boolean;
  getStatus(): CameraStatus;
  switchCamera(deviceId: string): Promise<void>;
  cleanup(): Promise<void>;
}
