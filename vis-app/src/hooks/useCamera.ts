import { useCallback, useEffect, useMemo } from 'react';
import { useCameraStore } from '@/stores/cameraStore';
import { BrowserCameraService } from '@/services/camera';

const serviceRef = new BrowserCameraService();

export function useCamera() {
  const store = useCameraStore();

  const startCamera = useCallback(async (options?: { deviceId?: string; videoElement?: HTMLVideoElement | null }) => {
    try {
      await serviceRef.startCamera(options);
      const snapshot = serviceRef.getSnapshot();
      store.setStream(snapshot.stream);
      store.setVideoElement(snapshot.videoElement);
      store.setStatus(snapshot.status);
      store.setCurrentFrame(snapshot.currentFrame);
      store.setFps(snapshot.fps);
      store.setResolution(snapshot.resolution.width, snapshot.resolution.height);
      store.setCameraDevices(snapshot.cameraDevices);
      store.setSelectedDeviceId(snapshot.selectedDeviceId);
      store.setLastError(snapshot.lastError);
      store.setStatus(snapshot.status);
    } catch (error) {
      const snapshot = serviceRef.getSnapshot();
      store.setStatus(snapshot.status);
      store.setLastError(snapshot.lastError);
      console.error('[useCamera] startCamera failed', error);
    }
  }, [store]);

  const stopCamera = useCallback(async () => {
    await serviceRef.stopCamera();
    const snapshot = serviceRef.getSnapshot();
    store.setStream(snapshot.stream);
    store.setVideoElement(snapshot.videoElement);
    store.setStatus(snapshot.status);
    store.setCurrentFrame(snapshot.currentFrame);
    store.setFps(snapshot.fps);
    store.setResolution(snapshot.resolution.width, snapshot.resolution.height);
    store.setCameraDevices(snapshot.cameraDevices);
    store.setSelectedDeviceId(snapshot.selectedDeviceId);
    store.setLastError(snapshot.lastError);
  }, [store]);

  const captureFrame = useCallback(async () => {
    const frame = await serviceRef.captureFrame();
    const snapshot = serviceRef.getSnapshot();
    store.setCurrentFrame(frame);
    store.setStatus(snapshot.status);
    store.setLastError(snapshot.lastError);
    return frame;
  }, [store]);

  const resumePreview = useCallback(async () => {
    await serviceRef.resumePreview();
    const snapshot = serviceRef.getSnapshot();
    store.setStream(snapshot.stream);
    store.setVideoElement(snapshot.videoElement);
    store.setStatus(snapshot.status);
    store.setCurrentFrame(snapshot.currentFrame);
    store.setFps(snapshot.fps);
    store.setResolution(snapshot.resolution.width, snapshot.resolution.height);
    store.setCameraDevices(snapshot.cameraDevices);
    store.setSelectedDeviceId(snapshot.selectedDeviceId);
    store.setLastError(snapshot.lastError);
  }, [store]);

  const switchCamera = useCallback(async (deviceId: string) => {
    await serviceRef.switchCamera(deviceId);
    const snapshot = serviceRef.getSnapshot();
    store.setSelectedDeviceId(snapshot.selectedDeviceId);
    store.setCameraDevices(snapshot.cameraDevices);
    store.setStatus(snapshot.status);
  }, [store]);

  useEffect(() => {
    return () => {
      void serviceRef.cleanup();
    };
  }, []);

  return useMemo(() => ({
    status: store.status,
    frameCount: store.frameCount,
    fps: store.fps,
    resolution: store.resolution,
    timestamp: store.timestamp,
    currentFrame: store.currentFrame,
    lastError: store.lastError,
    cameraDevices: store.cameraDevices,
    selectedDeviceId: store.selectedDeviceId,
    isRunning: store.isRunning,
    startCamera,
    stopCamera,
    captureFrame,
    resumePreview,
    switchCamera,
  }), [store.status, store.frameCount, store.fps, store.resolution, store.timestamp, store.currentFrame, store.lastError, store.cameraDevices, store.selectedDeviceId, store.isRunning, startCamera, stopCamera, captureFrame, resumePreview, switchCamera]);
}
