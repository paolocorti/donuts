// https://twitter.com/lusionltd/status/1701534187545636964
// https://lusion.co

import * as THREE from "three";
import { useRef, useReducer, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  useGLTF,
  MeshTransmissionMaterial,
  Environment,
  Lightformer,
  OrbitControls,
  useFBO,
} from "@react-three/drei";
import {
  CuboidCollider,
  BallCollider,
  Physics,
  RigidBody,
} from "@react-three/rapier";
import { EffectComposer, N8AO } from "@react-three/postprocessing";
import { easing } from "maath";
import {
  DebugLayerMaterial,
  LayerMaterial,
  Gradient,
  Color,
  Fresnel,
  Noise,
  Normal,
} from "lamina";

const accents = ["#4060ff", "#20ffa0", "#ff4060", "#ffcc00"];
const shuffle = (accent = 0) => [
  { color: "#ff9430", roughness: 1 },
  { color: "#fff", roughness: 1 },
  { color: "#4a7ed1", roughness: 1 },
  { color: "#f0115f", roughness: 1 },
  { color: "#03fcb6", roughness: 1 },
];

function Bg() {
  const mesh = useRef();
  // useFrame((state, delta) => {
  //   mesh.current.rotation.x = mesh.current.rotation.y = mesh.current.rotation.z += delta
  // })
  return (
    <mesh ref={mesh} scale={10} rotation={[0, 2.5, 0]}>
      <sphereGeometry args={[1, 64, 64]} />
      <LayerMaterial attach="material" side={1}>
        <Gradient colorA="#cccdab" colorB="#8dcec1" />
      </LayerMaterial>
    </mesh>
  );
}

export const App = () => <Scene />;

function Scene(props) {
  const [accent, click] = useReducer((state) => ++state % accents.length, 0);
  const connectors = useMemo(() => shuffle(accent), [accent]);
  return (
    <Canvas
      onClick={click}
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: false }}
      camera={{ position: [0, 0, 15], fov: 17.5, near: 1, far: 100 }}
      {...props}
    >
      {/* <color attach="background" args={['#8dcec1']} /> */}
      <Bg />
      <ambientLight intensity={1} />
      {/* <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow /> */}
      <Physics gravity={[0, 0, 0]}>
        <Pointer />
        {
          connectors.map((props, i) => <Connector key={i} {...props} />) /* prettier-ignore */
        }
      </Physics>
      {/* <EffectComposer disableNormalPass multisampling={8}>
        <N8AO distanceFalloff={1} aoRadius={1} intensity={2} />
      </EffectComposer> */}
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer
            form="circle"
            intensity={4}
            rotation-x={Math.PI / 2}
            position={[0, 5, -9]}
            scale={3}
          />
          <Lightformer
            form="circle"
            intensity={2}
            rotation-y={Math.PI / 2}
            position={[-5, 1, -1]}
            scale={3}
          />
          <Lightformer
            form="circle"
            intensity={2}
            rotation-y={Math.PI / 2}
            position={[-5, -1, -1]}
            scale={3}
          />
          <Lightformer
            form="circle"
            intensity={2}
            rotation-y={-Math.PI / 2}
            position={[10, 1, 0]}
            scale={8}
          />
        </group>
      </Environment>
      <OrbitControls />
    </Canvas>
  );
}

function Connector({
  position,
  children,
  vec = new THREE.Vector3(),
  scale,
  r = THREE.MathUtils.randFloatSpread,
  accent,
  ...props
}) {
  const api = useRef();
  const pos = useMemo(() => position || [r(10), r(10), r(10)], []);
  useFrame((state, delta) => {
    delta = Math.min(0.1, delta);
    api.current?.applyImpulse(
      vec.copy(api.current.translation()).negate().multiplyScalar(0.2)
    );
  });
  return (
    <RigidBody
      linearDamping={4}
      angularDamping={1}
      friction={0.1}
      position={pos}
      ref={api}
      colliders={false}
    >
      <CuboidCollider args={[1, 1, 0.38]} />
      {children ? children : <Model {...props} />}
      {accent && (
        <pointLight intensity={4} distance={2.5} color={props.color} />
      )}
    </RigidBody>
  );
}

function Pointer({ vec = new THREE.Vector3() }) {
  const ref = useRef();
  useFrame(({ mouse, viewport }) => {
    ref.current?.setNextKinematicTranslation(
      vec.set(
        (mouse.x * viewport.width) / 2,
        (mouse.y * viewport.height) / 2,
        0
      )
    );
  });
  return (
    <RigidBody
      position={[0, 0, 0]}
      type="kinematicPosition"
      colliders={false}
      ref={ref}
    >
      <BallCollider args={[1]} />
    </RigidBody>
  );
}

function Model({ children, color = "white", roughness = 0, ...props }) {
  const ref = useRef();
  const buffer = useFBO();

  useFrame((state, delta) => {
    easing.dampC(ref.current.material.color, color, 0.2, delta);
    state.gl.setRenderTarget(buffer);
    state.gl.render(state.scene, state.camera);
    state.gl.setRenderTarget(null);
  });
  return (
    <mesh ref={ref} castShadow receiveShadow scale={1}>
      <torusGeometry args={[0.75, 0.3, 32, 100]} />
      <MeshTransmissionMaterial
        // backside={false}
        // transmission={0.85}
        // samples={16}
        // resolution={256}
        // anisotropicBlur={0.2}
        // thickness={0.3}
        // roughness={0.4}
        // ior={2}
        // anisotropy={0.2}
        // attenuationColor={'#ffffff'}
        // background={buffer.texture}
        samples={16}
        thickness={200}
        anisotropicBlur={0.1}
        iridescence={1}
        iridescenceIOR={1}
        iridescenceThicknessRange={[0, 1400]}
        clearcoat={1}
        clearcoatRoughness={0.5}
        envMapIntensity={0.4}
        buffer={buffer.texture}
        ior={0.9}
      />
    </mesh>
  );
}
