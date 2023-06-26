import TransformVertices from "../FBO";
import { Perf } from "r3f-perf";
import { OrbitControls } from "@react-three/drei";
import React from "react";

export default function Scene() {
  return (
    <>
      <Perf position="top-left" />
      <OrbitControls makeDefault />

      <TransformVertices
        size={128}
        src={["/cyberpunk_car.obj", "/Mesh_Elephant.obj"]}
      />
    </>
  );
}
