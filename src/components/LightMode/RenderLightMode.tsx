type RenderLightModeProps = {
  activeColor: string;
};

/**
 * Inert boundary for the future atmospheric light-mode renderer.
 * App does not mount this component while light mode is unavailable.
 * coming soon po hehe
 */
export default function RenderLightMode({ activeColor }: RenderLightModeProps) {
  void activeColor;
  return null;
}
