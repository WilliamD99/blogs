import React from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "@/component/Scene";

export default function Home() {
  return (
    <>
      <div style={{ height: "100vh" }}>
        <Canvas camera={{ fov: 100, position: [1.5, 1.5, 2.5] }}>
          <color args={["black"]} attach="background" />
          <ambientLight intensity={0.5} />
          <Scene />
        </Canvas>
      </div>
    </>
  );
}
