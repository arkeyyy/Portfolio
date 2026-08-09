export const RENDERER_SNAPSHOT_VERSION = 1 as const;

export type RendererRgbSnapshot = [number, number, number];

export type RendererCameraSnapshot = {
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
};

export type DarkRendererSnapshot = {
  version: typeof RENDERER_SNAPSHOT_VERSION;
  capturedAtMs: number;
  sceneTimeMs: number;
  color: {
    current: RendererRgbSnapshot;
    target: RendererRgbSnapshot;
  };
  camera: RendererCameraSnapshot;
};

export type LightRendererSnapshot = {
  version: typeof RENDERER_SNAPSHOT_VERSION;
  capturedAtMs: number;
  sceneTimeMs: number;
  color: {
    current: RendererRgbSnapshot;
    from: RendererRgbSnapshot;
    target: RendererRgbSnapshot;
    transitionElapsedMs: number;
  };
  camera: RendererCameraSnapshot;
};

export type RendererSession<TSnapshot> = {
  readSnapshot: () => TSnapshot | null;
  writeSnapshot: (snapshot: TSnapshot) => void;
};

export type DeviceOrientationPermissionResult = 'granted' | 'denied';

export type DeviceOrientationSessionState = {
  status: 'unresolved' | 'requesting' | DeviceOrientationPermissionResult;
  pendingRequest: Promise<DeviceOrientationPermissionResult> | null;
};

export type DeviceOrientationSession = {
  getStatus: () => DeviceOrientationSessionState['status'];
  getPendingRequest: () => Promise<DeviceOrientationPermissionResult> | null;
  requestPermission: (
    requestPermission: () => Promise<DeviceOrientationPermissionResult>,
  ) => Promise<DeviceOrientationPermissionResult>;
  recoverOrphanedRequest: () => void;
};

export function requestDeviceOrientationPermission(
  session: DeviceOrientationSessionState,
  requestPermission: () => Promise<DeviceOrientationPermissionResult>,
): Promise<DeviceOrientationPermissionResult> {
  if (session.status === 'granted' || session.status === 'denied') {
    return Promise.resolve(session.status);
  }
  if (session.pendingRequest) return session.pendingRequest;

  session.status = 'requesting';
  let browserRequest: Promise<DeviceOrientationPermissionResult>;
  try {
    browserRequest = requestPermission();
  } catch {
    session.status = 'denied';
    return Promise.resolve('denied');
  }
  const request = browserRequest
    .then((permission) => {
      session.status = permission;
      session.pendingRequest = null;
      return permission;
    })
    .catch(() => {
      session.status = 'denied';
      session.pendingRequest = null;
      return 'denied' as const;
    });
  session.pendingRequest = request;
  return request;
}

export function isRendererRgbSnapshot(value: unknown): value is RendererRgbSnapshot {
  return Array.isArray(value)
    && value.length === 3
    && value.every((channel) => Number.isFinite(channel));
}

export function isRendererCameraSnapshot(
  value: unknown,
): value is RendererCameraSnapshot {
  if (!value || typeof value !== 'object') return false;
  const camera = value as RendererCameraSnapshot;
  return Number.isFinite(camera.currentX)
    && Number.isFinite(camera.currentY)
    && Number.isFinite(camera.targetX)
    && Number.isFinite(camera.targetY);
}

export function cloneRendererRgb(color: readonly number[]): RendererRgbSnapshot {
  return [color[0], color[1], color[2]];
}
