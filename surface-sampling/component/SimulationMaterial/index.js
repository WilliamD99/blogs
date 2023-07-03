import * as THREE from "three";

const vertex = `
varying vec2 vUv;

void main() {
    vUv = uv;

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;
}
`;
const fragment = `
uniform sampler2D positionsA;
uniform sampler2D positionsB;
uniform float uTime;
uniform float uFrequency;

varying vec2 vUv;

void main() {
    float time = abs(sin(uTime * 0.35));

    vec3 spherePositions = texture2D(positionsA, vUv).rgb;
    vec3 boxPositions = texture2D(positionsB, vUv).rgb;

    vec3 pos = mix(boxPositions, spherePositions, time);

    gl_FragColor = vec4(pos, 1.0);
}
`;

const getRandomData = (width, height) => {
  // we need to create a vec4 since we're passing the positions to the fragment shader
  // data textures need to have 4 components, R, G, B, and A
  const length = width * height * 4;
  const data = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    const stride = i * 4;

    const distance = Math.sqrt(Math.random() - 0.5) * 2.0;
    const theta = THREE.MathUtils.randFloatSpread(360);
    const phi = THREE.MathUtils.randFloatSpread(360);

    data[stride] = distance * Math.sin(theta) * Math.cos(phi);
    data[stride + 1] = distance * Math.sin(theta) * Math.sin(phi);
    data[stride + 2] = distance * Math.cos(theta);
    data[stride + 3] = 1.0; // this value will not have any impact
  }
  return data;
};

class SimulationMaterial extends THREE.ShaderMaterial {
  constructor(size, positionsA, positionsB) {
    const positionsTextureA = new THREE.DataTexture(
      positionsA ? positionsA.array : getRandomData(size, size),
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    positionsTextureA.needsUpdate = true;

    const positionsTextureB = new THREE.DataTexture(
      positionsB ? positionsB.array : getRandomData(size, size),
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    positionsTextureB.needsUpdate = true;

    const simulationUniforms = {
      positionsA: { value: positionsTextureA },
      positionsB: { value: positionsTextureB },
      uFrequency: { value: 5 },
      uTime: { value: 0 },
    };

    super({
      uniforms: simulationUniforms,
      vertexShader: vertex,
      fragmentShader: fragment,
    });
  }
}

export default SimulationMaterial;
