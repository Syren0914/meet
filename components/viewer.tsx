"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Center, Bounds, useGLTF } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

function Model() {
  const { scene } = useGLTF("/models/looplet.glb");
  const ref = useRef<THREE.Group>(null!);

  // Pick a random angular velocity (rad/sec) per axis once on mount
  const spin = useMemo(() => {
    const rnd = () => (Math.random() * 0.6 + 0.2) * (Math.random() < 0.5 ? -1 : 1); // 0.2–0.8 rad/s
    return new THREE.Vector3(rnd(), rnd(), rnd());
  }, []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += spin.x * delta;
    ref.current.rotation.y += spin.y * delta;
    ref.current.rotation.z += spin.z * delta;
  });

  return (
    <Center>
      <group ref={ref}>
        <primitive object={scene} />
      </group>
    </Center>
  );
}
useGLTF.preload("/models/looplet.glb");

export default function Viewer() {
  return (
    <div className="h-[100px] w-[100px]">
      <Canvas camera={{ position: [2, 1.2, 2.5], fov: 50 }} dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <Environment preset="city" />
          <Bounds fit clip margin={1.2}>
            <Model />
          </Bounds>
          <OrbitControls makeDefault minDistance={1.2} maxDistance={5} enablePan={false} />
        </Suspense>
      </Canvas>
    </div>
  );
}
