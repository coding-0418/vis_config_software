export class CameraError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'CameraError';
  }
}

export const formatCameraError = (error: unknown): string => {
  if (error instanceof DOMException) {
    return `${error.name}: ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

export const logCameraError = (context: string, error: unknown): void => {
  const message = formatCameraError(error);
  console.error(`[${context}]`, error);
  return console.error(`[${context}] ${message}`);
};
