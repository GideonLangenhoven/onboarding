"use client";

import { useEffect, useRef } from "react";

export function LiquidGradient() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId: number;
    let renderer: any;

    async function init() {
      const THREE = await import("three");

      // Touch texture for mouse interaction
      const touchCanvas = document.createElement("canvas");
      touchCanvas.width = touchCanvas.height = 64;
      const touchCtx = touchCanvas.getContext("2d")!;
      touchCtx.fillStyle = "black";
      touchCtx.fillRect(0, 0, 64, 64);
      const touchTexture = new THREE.Texture(touchCanvas);

      const trail: { x: number; y: number; age: number; force: number; vx: number; vy: number }[] = [];
      let lastTouch: { x: number; y: number } | null = null;

      function addTouch(x: number, y: number) {
        let force = 0, vx = 0, vy = 0;
        if (lastTouch) {
          const dx = x - lastTouch.x;
          const dy = y - lastTouch.y;
          if (dx === 0 && dy === 0) return;
          const d = Math.sqrt(dx * dx + dy * dy);
          vx = dx / d;
          vy = dy / d;
          force = Math.min((dx * dx + dy * dy) * 10000, 1.5);
        }
        lastTouch = { x, y };
        trail.push({ x, y, age: 0, force, vx, vy });
      }

      function updateTouch() {
        touchCtx.fillStyle = "black";
        touchCtx.fillRect(0, 0, 64, 64);
        for (let i = trail.length - 1; i >= 0; i--) {
          const p = trail[i];
          const f = p.force * (1 / 64) * (1 - p.age / 64);
          p.x += p.vx * f;
          p.y += p.vy * f;
          p.age++;
          if (p.age > 64) { trail.splice(i, 1); continue; }
          const px = p.x * 64;
          const py = (1 - p.y) * 64;
          let intensity = p.age < 19 ? Math.sin((p.age / 19) * (Math.PI / 2)) : -(1 - (p.age - 19) / 45) * ((1 - (p.age - 19) / 45) - 2);
          intensity *= p.force;
          const r = 16;
          touchCtx.shadowOffsetX = 320;
          touchCtx.shadowOffsetY = 320;
          touchCtx.shadowBlur = r;
          touchCtx.shadowColor = `rgba(${((p.vx + 1) / 2) * 255},${((p.vy + 1) / 2) * 255},${intensity * 255},${0.15 * intensity})`;
          touchCtx.beginPath();
          touchCtx.fillStyle = "rgba(255,0,0,1)";
          touchCtx.arc(px - 320, py - 320, r, 0, Math.PI * 2);
          touchCtx.fill();
        }
        touchTexture.needsUpdate = true;
      }

      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
      renderer.domElement.style.position = "absolute";
      renderer.domElement.style.inset = "0";

      const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
      camera.position.z = 50;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0f2b1f);

      const fov = (camera.fov * Math.PI) / 180;
      const h = Math.abs(camera.position.z * Math.tan(fov / 2) * 2);
      const w = h * camera.aspect;

      const uniforms = {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
        uColor1: { value: new THREE.Vector3(0.102, 0.235, 0.204) },  // #1a3c34 dark green
        uColor2: { value: new THREE.Vector3(0.176, 0.416, 0.310) },  // #2d6a4f mid green
        uColor3: { value: new THREE.Vector3(0.082, 0.180, 0.145) },  // #152e25 deeper green
        uColor4: { value: new THREE.Vector3(0.560, 0.335, 0.120) },  // dim sunset amber — brand warmth
        uColor5: { value: new THREE.Vector3(0.059, 0.137, 0.098) },  // #0f2319 very dark green
        uColor6: { value: new THREE.Vector3(0.160, 0.360, 0.260) },  // #295c42 sage green
        uTouchTexture: { value: touchTexture },
      };

      const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `
          varying vec2 vUv;
          void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            vUv = uv;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec2 uResolution;
          uniform vec3 uColor1;
          uniform vec3 uColor2;
          uniform vec3 uColor3;
          uniform vec3 uColor4;
          uniform vec3 uColor5;
          uniform vec3 uColor6;
          uniform sampler2D uTouchTexture;
          varying vec2 vUv;

          float grain(vec2 uv, float t) {
            return fract(sin(dot(uv * uResolution * 0.5 + t, vec2(12.9898, 78.233))) * 43758.5453) * 2.0 - 1.0;
          }

          void main() {
            vec2 uv = vUv;

            // Subtle mouse distortion
            vec4 tt = texture2D(uTouchTexture, uv);
            float vx = -(tt.r * 2.0 - 1.0);
            float vy = -(tt.g * 2.0 - 1.0);
            float ti = tt.b;
            uv.x += vx * 0.3 * ti;
            uv.y += vy * 0.3 * ti;

            float sp = 0.35; // slow, gentle speed

            // Six animated gradient centers
            vec2 c1 = vec2(0.5 + sin(uTime * sp * 0.4) * 0.4, 0.5 + cos(uTime * sp * 0.5) * 0.4);
            vec2 c2 = vec2(0.5 + cos(uTime * sp * 0.6) * 0.5, 0.5 + sin(uTime * sp * 0.45) * 0.5);
            vec2 c3 = vec2(0.5 + sin(uTime * sp * 0.35) * 0.45, 0.5 + cos(uTime * sp * 0.55) * 0.45);
            vec2 c4 = vec2(0.5 + cos(uTime * sp * 0.5) * 0.4, 0.5 + sin(uTime * sp * 0.4) * 0.4);
            vec2 c5 = vec2(0.5 + sin(uTime * sp * 0.7) * 0.35, 0.5 + cos(uTime * sp * 0.6) * 0.35);
            vec2 c6 = vec2(0.5 + cos(uTime * sp * 0.45) * 0.5, 0.5 + sin(uTime * sp * 0.65) * 0.5);

            float r = 0.55; // gradient radius
            float i1 = 1.0 - smoothstep(0.0, r, length(uv - c1));
            float i2 = 1.0 - smoothstep(0.0, r, length(uv - c2));
            float i3 = 1.0 - smoothstep(0.0, r, length(uv - c3));
            float i4 = 1.0 - smoothstep(0.0, r, length(uv - c4));
            float i5 = 1.0 - smoothstep(0.0, r, length(uv - c5));
            float i6 = 1.0 - smoothstep(0.0, r, length(uv - c6));

            // Blend colors gently
            vec3 col = vec3(0.0);
            col += uColor1 * i1 * (0.6 + 0.4 * sin(uTime * sp));
            col += uColor2 * i2 * (0.6 + 0.4 * cos(uTime * sp * 1.2));
            col += uColor3 * i3 * (0.6 + 0.4 * sin(uTime * sp * 0.8));
            col += uColor4 * i4 * (0.6 + 0.4 * cos(uTime * sp * 1.3));
            col += uColor5 * i5 * (0.6 + 0.4 * sin(uTime * sp * 1.1));
            col += uColor6 * i6 * (0.6 + 0.4 * cos(uTime * sp * 0.9));

            // Rotating radial overlay
            vec2 ruv = uv - 0.5;
            float a = uTime * sp * 0.12;
            ruv = vec2(ruv.x * cos(a) - ruv.y * sin(a), ruv.x * sin(a) + ruv.y * cos(a));
            float ri = 1.0 - smoothstep(0.0, 0.8, length(ruv));
            col += mix(uColor2, uColor4, ri) * 0.25;

            // Scale up for visible movement, then cap brightness
            col = col * 0.55;
            // Cap max brightness so it never gets too bright
            float maxB = 0.22;
            float curB = max(col.r, max(col.g, col.b));
            if (curB > maxB) col *= maxB / curB;

            // Dark green base in dim areas
            vec3 base = vec3(0.035, 0.085, 0.060);
            float br = length(col);
            col = mix(base, col, max(br * 2.0, 0.1));

            // Film grain
            col += grain(uv, uTime) * 0.04;
            col = clamp(col, vec3(0.0), vec3(1.0));

            gl_FragColor = vec4(col, 1.0);
          }
        `,
      });

      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h, 1, 1), material);
      scene.add(mesh);

      const clock = new THREE.Clock();

      function onMouseMove(e: MouseEvent) {
        const rect = container.getBoundingClientRect();
        addTouch((e.clientX - rect.left) / rect.width, 1 - (e.clientY - rect.top) / rect.height);
      }
      function onTouchMove(e: TouchEvent) {
        const t = e.touches[0];
        const rect = container.getBoundingClientRect();
        addTouch((t.clientX - rect.left) / rect.width, 1 - (t.clientY - rect.top) / rect.height);
      }

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("touchmove", onTouchMove);

      function tick() {
        const delta = Math.min(clock.getDelta(), 0.1);
        uniforms.uTime.value += delta;
        updateTouch();
        renderer.render(scene, camera);
        animId = requestAnimationFrame(tick);
      }

      function onResize() {
        if (!container) return;
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        camera.aspect = cw / ch;
        camera.updateProjectionMatrix();
        renderer.setSize(cw, ch);
        uniforms.uResolution.value.set(cw, ch);
        const nh = Math.abs(camera.position.z * Math.tan(fov / 2) * 2);
        const nw = nh * camera.aspect;
        mesh.geometry.dispose();
        mesh.geometry = new THREE.PlaneGeometry(nw, nh, 1, 1);
      }
      window.addEventListener("resize", onResize);

      tick();

      return () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("resize", onResize);
      };
    }

    let cleanup: (() => void) | undefined;
    init().then((fn) => { cleanup = fn; });

    return () => {
      cancelAnimationFrame(animId);
      cleanup?.();
      if (renderer) {
        renderer.dispose();
        renderer.domElement?.remove();
      }
    };
  }, []);

  return <div ref={containerRef} style={{ position: "absolute", inset: 0, zIndex: 0 }} />;
}
