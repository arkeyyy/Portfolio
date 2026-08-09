export type BackgroundRendererKind = 'dark' | 'light';

type RendererPrewarmer = () => void;

const rendererPrewarmers: Partial<Record<BackgroundRendererKind, RendererPrewarmer>> = {};

export function registerRendererPrewarmer(
  renderer: BackgroundRendererKind,
  prewarm: RendererPrewarmer,
) {
  rendererPrewarmers[renderer] = prewarm;
}

export function prewarmBackgroundRenderer(renderer: BackgroundRendererKind) {
  rendererPrewarmers[renderer]?.();
}
