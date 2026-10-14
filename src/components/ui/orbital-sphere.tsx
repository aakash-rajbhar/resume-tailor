"use client";

import { useEffect, useRef } from "react";
import {
  createOrbitalSphereRenderer,
  ORBITAL_SPHERE_DEFAULTS,
  type OrbitalSphereOptions,
} from "@/components/ui/orbital-sphere-utils/orbitalSphereRenderer";

export type OrbitalSphereBackgroundProps = Partial<OrbitalSphereOptions> & {
  className?: string;
};

export function OrbitalSphereBackground({
  className = "",
  ...props
}: OrbitalSphereBackgroundProps) {
  const mergedOptions = { ...ORBITAL_SPHERE_DEFAULTS, ...props };
  const hostRef = useRef<HTMLDivElement>(null),
    canvasRef = useRef<HTMLCanvasElement>(null),
    optionsRef = useRef(mergedOptions);

  // Keep the live options in sync for the animation loop (written after render).
  useEffect(() => {
    optionsRef.current = mergedOptions;
  });

  useEffect(() => {
    const host = hostRef.current,
      canvas = canvasRef.current;
    if (!host || !canvas) return undefined;
    const renderer = createOrbitalSphereRenderer(
      canvas,
      () => optionsRef.current,
    );
    const applyTheme = () =>
      renderer.setTheme(document.documentElement.classList.contains("dark"));
    applyTheme();
    // Re-apply when the app toggles light/dark (or follows the system theme).
    const themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    let frame = 0,
      visible = true;
    const resize = () => {
      const bounds = host.getBoundingClientRect();
      renderer.resize(bounds.width, bounds.height);
      renderer.render();
    };
    const tick = () => {
      renderer.render();
      frame = visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const resizeObserver = new ResizeObserver(resize),
      intersection = new IntersectionObserver(([entry]) => {
        visible = entry?.isIntersecting ?? true;
        if (visible && !frame) frame = requestAnimationFrame(tick);
        if (!visible && frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      });
    // Resume the loop when the tab becomes visible again (it stops while hidden).
    const onVisibility = () => {
      if (!document.hidden && visible && !frame) frame = requestAnimationFrame(tick);
    };
    document.addEventListener("visibilitychange", onVisibility);
    resizeObserver.observe(host);
    intersection.observe(host);
    resize();
    frame = requestAnimationFrame(tick);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
      themeObserver.disconnect();
      resizeObserver.disconnect();
      intersection.disconnect();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={`threeui-background orbital-sphere${className ? ` ${className}` : ""}`}
    >
      <canvas style={{ filter: `hue-rotate(${mergedOptions.hue}deg)` }} ref={canvasRef} />
    </div>
  );
}

export default OrbitalSphereBackground;
