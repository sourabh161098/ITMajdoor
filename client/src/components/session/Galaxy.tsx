import { useEffect, useRef } from "react";

/**
 * An animated starfield / Milky-Way backdrop drawn on a canvas. Used behind the
 * "Finding another IT Majdoor…" waiting overlay so it feels like we're scanning
 * the whole universe for a partner. Occasionally a shooting star (tootha taara)
 * streaks across.
 *
 * Pure client-side eye-candy, no dependencies. Respects prefers-reduced-motion
 * (falls back to a static field of stars).
 */

interface Star {
  // 3D position relative to the center. z is depth (smaller = closer).
  x: number;
  y: number;
  z: number;
  pz: number; // previous projected z, for a subtle motion trail
  twinkleSpeed: number;
  phase: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  life: number; // 0..1 remaining
}

export function Galaxy() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let stars: Star[] = [];
    let shooting: ShootingStar[] = [];
    let raf = 0;
    let lastShoot = 0;

    // Spawn a single star at a random depth, spread across a 3D volume.
    const makeStar = (): Star => {
      const z = Math.random() * width;
      return {
        x: (Math.random() - 0.5) * width,
        y: (Math.random() - 0.5) * height,
        z,
        pz: z,
        twinkleSpeed: Math.random() * 1.6 + 0.4,
        phase: Math.random() * Math.PI * 2,
      };
    };

    // (Re)build the scene for the current canvas size.
    const setup = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Star count scales with area (kept modest for performance).
      const count = Math.min(340, Math.floor((width * height) / 1500));
      stars = Array.from({ length: count }, makeStar);
    };

    // Draw the soft Milky-Way band: a couple of diagonal glowing gradients.
    const drawMilkyWay = () => {
      const g = ctx.createLinearGradient(0, height, width, 0);
      g.addColorStop(0, "rgba(80, 70, 140, 0)");
      g.addColorStop(0.45, "rgba(120, 90, 180, 0.10)");
      g.addColorStop(0.5, "rgba(160, 120, 210, 0.16)");
      g.addColorStop(0.55, "rgba(120, 90, 180, 0.10)");
      g.addColorStop(1, "rgba(80, 70, 140, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);

      // A warm accent haze near the center, on-brand.
      const haze = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        Math.max(width, height) / 2
      );
      haze.addColorStop(0, "rgba(255, 138, 0, 0.06)");
      haze.addColorStop(1, "rgba(255, 138, 0, 0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, width, height);
    };

    const spawnShootingStar = () => {
      // Start from a random point in the upper-left region, streak down-right.
      const startX = Math.random() * width * 0.6;
      const startY = Math.random() * height * 0.4;
      const speed = Math.random() * 6 + 6;
      const angle = Math.PI / 5 + (Math.random() * Math.PI) / 10; // ~36-54°
      shooting.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        len: Math.random() * 80 + 60,
        life: 1,
      });
    };

    const render = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      // Deep-space base.
      ctx.fillStyle = "#05060a";
      ctx.fillRect(0, 0, width, height);

      drawMilkyWay();

      // Fly the camera forward through a 3D star field. Each star projects from
      // depth z onto the screen; as z shrinks it moves outward from center and
      // grows, giving a moving, 3D "through space" feel.
      const time = t / 1000;
      const cx = width / 2;
      const cy = height / 2;
      // Forward speed (0 under reduced motion → stars just twinkle in place).
      const speed = reduceMotion ? 0 : width * 0.06;
      const dt = 1 / 60;

      for (const s of stars) {
        if (!reduceMotion) {
          s.pz = s.z;
          s.z -= speed * dt;
          // Recycle stars that pass the camera back to the far plane.
          if (s.z <= 1) {
            s.x = (Math.random() - 0.5) * width;
            s.y = (Math.random() - 0.5) * height;
            s.z = width;
            s.pz = s.z;
          }
        }

        // Perspective projection.
        const k = 128 / s.z;
        const px = cx + s.x * k;
        const py = cy + s.y * k;
        if (px < 0 || px >= width || py < 0 || py >= height) continue;

        // Closer stars are bigger and brighter; add a gentle twinkle.
        const size = Math.max(0.2, (1 - s.z / width) * 2.6);
        const twinkle = 0.55 + Math.sin(time * s.twinkleSpeed + s.phase) * 0.25;
        const alpha = Math.max(0, Math.min(1, (1 - s.z / width) * twinkle + 0.15));

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Shooting stars (tootha taara) — skip entirely under reduced motion.
      if (!reduceMotion) {
        // Spawn one every 2.5–5s.
        if (t - lastShoot > 2500 + Math.random() * 2500) {
          lastShoot = t;
          spawnShootingStar();
        }
        shooting = shooting.filter((sh) => sh.life > 0);
        for (const sh of shooting) {
          sh.x += sh.vx;
          sh.y += sh.vy;
          sh.life -= 0.012;
          const tailX = sh.x - sh.vx * (sh.len / 10);
          const tailY = sh.y - sh.vy * (sh.len / 10);
          const grad = ctx.createLinearGradient(sh.x, sh.y, tailX, tailY);
          grad.addColorStop(0, `rgba(255,255,255,${Math.max(0, sh.life)})`);
          grad.addColorStop(1, "rgba(255,255,255,0)");
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sh.x, sh.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(render);
    };

    setup();
    raf = requestAnimationFrame(render);

    const onResize = () => setup();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
