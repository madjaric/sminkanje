export const pigmentVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  attribute float aSeed;
  attribute float aScale;
  attribute float aBrightness;
  varying float vAlpha;
  varying float vBrightness;
  varying float vSoftness;

  // Cheap pseudo-noise, good enough for gentle drift at this scale.
  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  void main() {
    vec3 pos = position;
    float t = uTime * 0.3 + aSeed * 6.2831;
    float drift = 0.1 + aScale * 0.05;

    pos.x += sin(t + aSeed * 3.1) * drift;
    pos.y += cos(t * 0.75 + aSeed * 4.7) * drift * 1.1 + uTime * 0.04 * (hash(aSeed) - 0.3);
    pos.z += sin(t * 1.2 + aSeed * 2.3) * drift;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float perspective = 130.0 / -mvPosition.z;
    gl_PointSize = aScale * perspective * uIntensity;

    vAlpha = (0.16 + 0.46 * hash(aSeed + 2.0)) * smoothstep(0.0, 1.0, uIntensity);
    vBrightness = aBrightness;
    vSoftness = clamp(aScale / 2.4, 0.0, 1.0);
  }
`;

export const pigmentFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  varying float vBrightness;
  varying float vSoftness;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv) * 2.0;
    // Small/dim flecks stay a sharp pinpoint; larger ones soften toward a
    // diffuse, lower-opacity bokeh disc instead of a hard uniform circle.
    float edge = mix(0.1, 0.9, vSoftness);
    float alpha = smoothstep(1.0, edge, d) * vAlpha * mix(1.0, 0.5, vSoftness);
    if (alpha < 0.008) discard;

    vec3 color = uColor * mix(0.55, 2.4, vBrightness);
    gl_FragColor = vec4(color, alpha);
  }
`;
