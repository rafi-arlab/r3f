# Shader Template Guide (React Three Fiber)

This project includes a reusable starter shader in [src/GradientShader.jsx](src/GradientShader.jsx).

Use this guide as a quick reference for **what each part does**, **what to tweak**, and **how to reuse it**.

## 1) Big Picture

A mesh in R3F is:

- Geometry (shape)
- Material (how it looks)

Your shader material replaces built-in materials and is made of:

- **Vertex shader**: moves vertices (geometry deformation)
- **Fragment shader**: colors pixels (surface appearance)

---

## 2) File Structure and Data Flow

### Shader file

- [src/GradientShader.jsx](src/GradientShader.jsx)

### Scene usage

- [src/App.jsx](src/App.jsx)

### Flow

1. `useFrame` updates `u_time` every frame.
2. Vertex shader reads `u_time`, modifies `position`, outputs `vPosition` and `vUv`.
3. Fragment shader reads `vPosition`/`vUv` + `u_time`, computes gradient color.
4. Result is rendered on the mesh using `<GradientShaderMaterial />`.

---

## 3) Shader Concepts Used Here

## Uniforms (JS -> GPU)

Defined in JS and available in both shaders.

- `u_time` (`float`): elapsed time for animation
- `u_colorA` (`vec3`): first gradient color
- `u_colorB` (`vec3`): second gradient color

In [src/GradientShader.jsx](src/GradientShader.jsx), they are passed in `uniforms={{ ... }}`.

## Varyings (Vertex -> Fragment)

Written in vertex shader, read in fragment shader.

- `vUv`: UV coordinates (0..1 range)
- `vPosition`: transformed vertex position

This is how fragment color logic can react to vertex animation.

---

## 4) Vertex Shader: Squish Animation

Current behavior:

- Uses `sin(u_time * 2.0)` to oscillate
- Converts to a range that scales Y (`pos.y *= squishAmount`)
- Gives a squash/stretch style deformation

Main tuning values:

- `u_time * 2.0` = animation speed
- `0.2` = minimum squash (lower means flatter)
- `* 0.8` = squash range

### Common edits

- Squish X instead of Y: change `pos.y` to `pos.x`
- Squish Z instead of Y: change `pos.y` to `pos.z`
- Invert pulse direction: negate the sine term

---

## 5) Fragment Shader: Animated Gradient

Current behavior:

- Base gradient from `vPosition.y + 0.5`
- Time-based wave modulation with `sin` and `cos`
- Center ripple using `length(vUv - 0.5)`
- Final color via `mix(u_colorA, u_colorB, mixStrength)`

Main tuning values:

- `0.8`, `0.5`, `2.0` = temporal speeds
- `3.0`, `2.0`, `10.0` = spatial frequencies
- `0.3`, `0.2`, `0.15` = effect strengths

### Common edits

- Horizontal gradient: use `vPosition.x` instead of `vPosition.y`
- Diagonal blend: use `(vPosition.x + vPosition.y) * 0.5`
- Softer color shift: reduce effect strengths (e.g. `0.3 -> 0.1`)

---

## 6) How to Reuse as a Template

## Step A: Put on any mesh

In [src/App.jsx](src/App.jsx), attach material to any geometry:

```jsx
<mesh>
  <sphereGeometry args={[1, 64, 64]} />
  <GradientShaderMaterial colorA="#ff0080" colorB="#00d4ff" />
</mesh>
```

## Step B: Keep enough geometry detail for deformation

Vertex deformation needs vertices to move.

- Box with few segments = blocky deformation
- Sphere/plane with many segments = smooth deformation

Example with more segments:

```jsx
<planeGeometry args={[2, 2, 64, 64]} />
```

## Step C: Add new uniforms safely

1. Add uniform in GLSL (`uniform float u_strength;`)
2. Add same key in JS `uniforms`
3. Update value in `useFrame` or props

---

## 7) Practical Tips

- If shader appears frozen, verify `u_time` is being updated each frame.
- If animation looks jagged, increase geometry segments.
- If colors clip too hard, clamp blend factor:

```glsl
mixStrength = clamp(mixStrength, 0.0, 1.0);
```

- Keep changes small and iterate one constant at a time.

---

## 8) Quick Parameter Cheat Sheet

- **Speed up all animation**: multiply `u_time` by bigger values.
- **More squish**: lower squash minimum (`0.2 -> 0.1`).
- **Less squish**: raise squash minimum (`0.2 -> 0.5`).
- **More color movement**: increase wave strengths (`0.3`, `0.2`, `0.15`).
- **Calmer look**: reduce spatial frequencies (`10.0 -> 4.0`).

---

## 9) Next Template Upgrades (Optional)

If you want this template to be more production-friendly later:

- Expose speed/intensity as React props
- Add `u_mouse` for cursor interaction
- Move shaders to `.glsl` files (via a Vite GLSL plugin)
- Add a small Leva panel to tweak uniforms live

---

If you want, the next step can be a **v2 template** where all key constants are controlled by props (no shader code edits needed).