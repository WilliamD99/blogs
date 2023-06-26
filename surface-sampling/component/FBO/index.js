import React, { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFBO } from "@react-three/drei";
import { createPortal, useFrame, useLoader, extend } from "@react-three/fiber";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import SimulationMaterial from "@/component/SimulationMaterial";

import vertex from "@/utils/vertex.glsl";
import fragment from "@/utils/fragment.glsl";

extend({ SimulationMaterial: SimulationMaterial });

function normalizeArray(array, chunkSize = 1000) {
  const normalizedArray = [];

  // Process the array in chunks
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);

    // Find the minimum and maximum absolute values of the chunk
    const maxAbsValue = Math.max(...chunk.map(Math.abs));

    // Calculate the scale factor to normalize the values between -1 and 1
    const scaleFactor = maxAbsValue !== 0 ? 1 / maxAbsValue : 1;

    // Normalize each value in the chunk to a range between -1 and 1
    const normalizedChunk = chunk.map((value) => value * scaleFactor);

    // Add the normalized chunk to the output array
    normalizedArray.push(...normalizedChunk);
  }

  return normalizedArray;
}

// 0.35 is the speed. If you want to change the speed, change it here
// and change it in the fragment shader of the SimulationMaterial
let uTime = Math.PI / 2 / 0.35;

/**
 *
 * @param {size} number of particle (int)
 * @param {obj} models path (array of path)
 * @param {obj} auto boolean (whether the animation should be auto)
 * @returns
 */
export default function TransformVertices({ size = 150, src }) {
  const points = useRef();
  const simulationMaterialRef = useRef();

  const [isAnimating, setIsAnimating] = useState(false);

  let simulatedTimeMemo = 0;
  let simulatedClickTime = 1;

  const handleClick = () => {
    simulatedClickTime += 1;
    setIsAnimating(true);
  };

  const models = useLoader(OBJLoader, src);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(
    -1,
    1,
    1,
    -1,
    1 / Math.pow(2, 53),
    1
  );
  const positions = new Float32Array([
    -1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0,
  ]);
  const uvs = new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]);

  const renderTarget = useFBO(size, size, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    stencilBuffer: false,
    type: THREE.FloatType,
  });

  const particlesPosition = useMemo(() => {
    const length = size * size;
    const particles = new Float32Array(length * 3);

    for (let i = 0; i < length; i++) {
      let i3 = i * 3;
      particles[i3] = (i % size) / size;
      particles[i3 + 1] = i / size / size;
    }
    return particles;
  }, [size]);

  // Generating vertices position for model
  let sampler = useMemo(() => {
    return {
      objectA: new MeshSurfaceSampler(models[0].children[0]).build(),
      objectB: new MeshSurfaceSampler(models[1].children[0]).build(),
    };
  }, []);
  const modelPositions = useMemo(() => {
    const tempPositionA = new THREE.Vector4();
    const tempPositionB = new THREE.Vector4();
    const verticesA = [];
    const verticesB = [];

    for (let i = 0; i < (size * size * 4) / 3; i++) {
      // Model A
      sampler.objectA.sample(tempPositionA);
      verticesA.push(tempPositionA.x, tempPositionA.y, tempPositionA.z, 1.0);

      // Model B
      sampler.objectB.sample(tempPositionB);
      verticesB.push(tempPositionB.x, tempPositionB.y, tempPositionB.z, 1.0);
    }

    // Reduce the range proportionally to -1 -> 1
    const normalizeA = normalizeArray(verticesA);
    const normalizeB = normalizeArray(verticesB);

    return {
      positionA: { value: new THREE.Float32BufferAttribute(normalizeA, 3) },
      positionB: { value: new THREE.Float32BufferAttribute(normalizeB, 3) },
    };
  }, [size]);

  // Uniform for the particles
  let uniforms = useMemo(() => {
    return {
      uTime: { value: 0 },
      uPositions: { value: null },
    };
  }, []);

  useFrame((state) => {
    const { gl } = state;

    gl.setRenderTarget(renderTarget);
    gl.clear();
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    points.current.material.uniforms.uPositions.value = renderTarget.texture;

    simulationMaterialRef.current.uniforms.uTime.value = simulatedTimeMemo;
    if (isAnimating) {
      if (simulatedTimeMemo < uTime * simulatedClickTime) {
        let temp = simulatedTimeMemo + 0.01;
        simulatedTimeMemo = temp;
      }
    }
  });

  return (
    <>
      <mesh onClick={handleClick} position-x={-2}>
        <boxGeometry args={[1, 1, 1]} />
        <meshNormalMaterial wireframe toneMapped={false} />
      </mesh>
      {createPortal(
        <mesh>
          <simulationMaterial
            ref={simulationMaterialRef}
            args={[
              size,
              modelPositions.positionA.value,
              modelPositions.positionB.value,
            ]}
          />
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={positions.length / 3}
              array={positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-uv"
              count={uvs.length / 2}
              array={uvs}
              itemSize={2}
            />
          </bufferGeometry>
        </mesh>,
        scene
      )}
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particlesPosition.length / 3}
            array={particlesPosition}
            itemSize={3}
          />
        </bufferGeometry>
        <shaderMaterial
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fragmentShader={fragment}
          vertexShader={vertex}
          uniforms={uniforms}
          // toneMapped={false}
        />
      </points>
    </>
  );
}
