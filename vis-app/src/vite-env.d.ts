/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  /** Set to 'true' to enable test image upload in non-dev builds (e.g. staging). */
  readonly VITE_TEST_IMAGE_UPLOAD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
