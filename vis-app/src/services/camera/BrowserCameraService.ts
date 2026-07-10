import { CameraError, formatCameraError, logCameraError } from './CameraErrors';
import type { CameraFrame, CameraDevice, CameraStatus, ICameraService } from './CameraTypes';

export class BrowserCameraService implements ICameraService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private status: CameraStatus = 'offline';
  private currentFrame: CameraFrame | null = null;
  private fps = 0;
  private resolution = { width: 640, height: 480 };
  private isRunningFlag = false;
  private lastError: string | null = null;
  private cameraDevices: CameraDevice[] = [];
  private selectedDeviceId: string | null = null;
  private fpsTimer: number | null = null;
  private frameCount = 0;
  private frameCountTimer: number | null = null;

  constructor() {
    console.debug('[BrowserCameraService] initialized');
  }

  async startCamera(options?: { deviceId?: string; videoElement?: HTMLVideoElement | null }): Promise<void> {
    console.debug('[BrowserCameraService] startCamera()');
    if (this.isRunningFlag) {
      await this.resumePreview();
      return;
    }

    this.setStatus('requesting');
    this.videoElement = options?.videoElement ?? null;

    try {
      await this.enumerateDevices();
      const deviceId = options?.deviceId ?? this.selectedDeviceId ?? undefined;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
        audio: false,
      });

      this.stream = stream;
      this.isRunningFlag = true;
      this.selectedDeviceId = deviceId ?? this.selectedDeviceId ?? null;
      this.attachStreamToVideo();
      await this.playVideo();
      this.setStatus('live');
      this.startFpsLoop();
      console.debug('[BrowserCameraService] camera started', { deviceId: this.selectedDeviceId });
    } catch (error) {
      this.isRunningFlag = false;
      this.setStatus('error');
      this.setLastError(formatCameraError(error));
      logCameraError('BrowserCameraService.startCamera', error);
      throw new CameraError('Unable to start camera', error);
    }
  }

  async stopCamera(): Promise<void> {
    console.debug('[BrowserCameraService] stopCamera()');
    this.stopFpsLoop();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.isRunningFlag = false;
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.setStatus('stopped');
    console.debug('[BrowserCameraService] camera stopped');
  }

  async captureFrame(): Promise<CameraFrame | null> {
    console.debug('[BrowserCameraService] captureFrame()');
    if (!this.videoElement || !this.stream) {
      return null;
    }

    this.setStatus('capturing');
    const canvas = document.createElement('canvas');
    canvas.width = this.videoElement.videoWidth || this.resolution.width;
    canvas.height = this.videoElement.videoHeight || this.resolution.height;
    const context = canvas.getContext('2d');
    if (!context) {
      this.setStatus('error');
      return null;
    }

    context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const frame: CameraFrame = {
      dataUrl,
      width: canvas.width,
      height: canvas.height,
      timestamp: new Date().toISOString(),
    };
    this.currentFrame = frame;
    this.setStatus('stopped');
    console.debug('[BrowserCameraService] frame captured', { width: frame.width, height: frame.height });
    return frame;
  }

  async resumePreview(): Promise<void> {
    console.debug('[BrowserCameraService] resumePreview()');
    if (!this.stream && this.videoElement) {
      await this.startCamera({ videoElement: this.videoElement, deviceId: this.selectedDeviceId ?? undefined });
      return;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = this.stream;
      await this.playVideo();
      this.setStatus('live');
    }
  }

  getCurrentFrame(): CameraFrame | null {
    return this.currentFrame;
  }

  isRunning(): boolean {
    return this.isRunningFlag;
  }

  getStatus(): CameraStatus {
    return this.status;
  }

  async switchCamera(deviceId: string): Promise<void> {
    console.debug('[BrowserCameraService] switchCamera()', { deviceId });
    this.selectedDeviceId = deviceId;
    if (this.isRunningFlag) {
      await this.stopCamera();
      await this.startCamera({ deviceId, videoElement: this.videoElement ?? undefined });
    }
  }

  async cleanup(): Promise<void> {
    console.debug('[BrowserCameraService] cleanup()');
    await this.stopCamera();
    this.videoElement = null;
    this.currentFrame = null;
    this.lastError = null;
    this.cameraDevices = [];
    this.selectedDeviceId = null;
  }

  getSnapshot() {
    return {
      stream: this.stream,
      videoElement: this.videoElement,
      status: this.status,
      currentFrame: this.currentFrame,
      fps: this.fps,
      resolution: this.resolution,
      isRunning: this.isRunningFlag,
      lastError: this.lastError,
      cameraDevices: this.cameraDevices,
      selectedDeviceId: this.selectedDeviceId,
    };
  }

  private async enumerateDevices(): Promise<void> {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    this.cameraDevices = devices
      .filter((device) => device.kind === 'videoinput')
      .map((device) => ({ deviceId: device.deviceId, label: device.label || `Camera ${device.deviceId.slice(0, 4)}` }));

    if (!this.selectedDeviceId && this.cameraDevices[0]) {
      this.selectedDeviceId = this.cameraDevices[0].deviceId;
    }

    console.debug('[BrowserCameraService] enumerateDevices()', this.cameraDevices);
  }

  private attachStreamToVideo(): void {
    if (!this.videoElement) {
      return;
    }
    this.videoElement.srcObject = this.stream;
  }

  private async playVideo(): Promise<void> {
    if (!this.videoElement) {
      return;
    }

    try {
      await this.videoElement.play();
    } catch (error) {
      console.warn('[BrowserCameraService] video.play() interrupted', error);
    }

    if (this.videoElement.videoWidth && this.videoElement.videoHeight) {
      this.resolution = { width: this.videoElement.videoWidth, height: this.videoElement.videoHeight };
    }
  }

  private startFpsLoop(): void {
    this.stopFpsLoop();
    this.frameCount = 0;
    this.frameCountTimer = window.setInterval(() => {
      this.frameCount += 1;
    }, 1000 / 30);

    this.fpsTimer = window.setInterval(() => {
      this.fps = this.frameCount;
      this.frameCount = 0;
    }, 1000);
  }

  private stopFpsLoop(): void {
    if (this.frameCountTimer) {
      window.clearInterval(this.frameCountTimer);
      this.frameCountTimer = null;
    }
    if (this.fpsTimer) {
      window.clearInterval(this.fpsTimer);
      this.fpsTimer = null;
    }
  }

  private setStatus(status: CameraStatus): void {
    this.status = status;
  }

  private setLastError(error: string | null): void {
    this.lastError = error;
  }
}
