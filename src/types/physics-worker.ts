export interface MouseData {
  x: number;
  y: number;
}

export interface InitPayload {
  width: number;
  height: number;
  isMobile: boolean;
}

export interface ResizePayload {
  width: number;
  height: number;
}

export interface UpdateMousePayload {
  mousePos: MouseData;
  isMouseDown: boolean;
}

export interface UpdateSettingsPayload {
  pullStrength: number;
  baseColor: string;
}

export interface BufferPayload {
    particles: ArrayBuffer;
}

export type WorkerMessage =
  | { type: 'init'; payload: InitPayload }
  | { type: 'resize'; payload: ResizePayload }
  | { type: 'updateMouse'; payload: UpdateMousePayload }
  | { type: 'updateSettings'; payload: UpdateSettingsPayload }
  | { type: 'bufferBack'; payload: BufferPayload };

export interface RenderMessage {
    type: 'render';
    particles: ArrayBuffer;
} 