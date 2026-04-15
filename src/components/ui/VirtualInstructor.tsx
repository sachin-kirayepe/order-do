import { useRef, useMemo, useEffect, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useTalkingCharacter } from '../../context/TalkingCharacterContext';

// High-quality Indian female character (Ready Player Me)
// Features: Salwar Kameez, Ponytail, Expressive eyes
const MODEL_URL = 'https://models.readyplayer.me/6584288018e69818816827a5.glb?morphTargets=ARKit,Oculus%20Visemes';

function InstructorModel() {
  const group = useRef<THREE.Group>(null);
  const gltf = useGLTF(MODEL_URL, true) as any;
  const { nodes, materials, animations } = gltf || {};
  const { actions, names } = useAnimations(animations || [], group);
  const { isSpeaking, action } = useTalkingCharacter();

  // Optimized Resource Disposal
  useEffect(() => {
    return () => {
      if (group.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        group.current.traverse((obj: any) => {
          if (obj.isMesh) {
            obj.geometry.dispose();
            if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose());
            else obj.material.dispose();
          }
        });
      }
    };
  }, []);

  const headMesh = useMemo(() => {
    if (!nodes) return null;
    let mesh: any = null;
    Object.values(nodes).forEach((node: any) => {
      if (node.type === 'SkinnedMesh' && node.morphTargetDictionary) {
        if (node.name.toLowerCase().includes('head') || node.name.toLowerCase().includes('avatar')) {
          mesh = node;
        }
      }
    });
    return mesh;
  }, [nodes]);

  useEffect(() => {
    if (actions && names && names.length > 0) {
      const nextAction = names.find(n => n.toLowerCase().includes(action)) || 
                         names.find(n => n.toLowerCase().includes('idle')) || 
                         names[0];
      const animationAction = actions[nextAction];
      if (animationAction) {
        Object.values(actions).forEach(a => a?.fadeOut(0.3));
        animationAction.reset().fadeIn(0.3).play();
      }
    }
  }, [actions, names, action]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (group.current) {
      group.current.position.y = -1.5 + Math.sin(time * 1.5) * 0.03;
      group.current.rotation.y = Math.sin(time * 0.5) * 0.05 + state.mouse.x * 0.1;
      group.current.rotation.x = -state.mouse.y * 0.05;
      
      // Simple LOD: Check distance to camera
      const dist = state.camera.position.distanceTo(group.current.position);
      group.current.visible = dist < 10; // Hide if too far
    }

    if (headMesh && headMesh.morphTargetDictionary && headMesh.morphTargetInfluences) {
      const dict = headMesh.morphTargetDictionary;
      const influences = headMesh.morphTargetInfluences;
      const blinkVal = Math.sin(time * 4) > 0.98 ? 1 : 0;
      const mouthVal = isSpeaking ? Math.abs(Math.sin(time * 18)) * 0.7 + (Math.random() * 0.2) : 0;
      
      const eyeL = dict['eyeBlinkLeft'] || dict['EyeBlinkLeft'];
      const eyeR = dict['eyeBlinkRight'] || dict['EyeBlinkRight'];
      const jaw = dict['jawOpen'] || dict['mouthOpen'];

      if (eyeL !== undefined) influences[eyeL] = THREE.MathUtils.lerp(influences[eyeL], blinkVal, 0.2);
      if (eyeR !== undefined) influences[eyeR] = THREE.MathUtils.lerp(influences[eyeR], blinkVal, 0.2);
      if (jaw !== undefined) influences[jaw] = THREE.MathUtils.lerp(influences[jaw], mouthVal, 0.3);
    }
  });

  if (!nodes || !materials) return <ProfessionalFallback isSpeaking={isSpeaking} />;

  return (
    <group ref={group} dispose={null} position={[0, -1.5, 0]} scale={1.1}>
      <primitive object={nodes.Hips} />
      {Object.values(nodes).map((node: any, i) => (
        node.type === 'SkinnedMesh' && (
          <skinnedMesh
            key={i}
            geometry={node.geometry}
            material={materials[node.material.name]}
            skeleton={node.skeleton}
            morphTargetDictionary={node.morphTargetDictionary}
            morphTargetInfluences={node.morphTargetInfluences}
            castShadow
            receiveShadow
          />
        )
      ))}
    </group>
  );
}

function ProfessionalFallback({ isSpeaking }: { isSpeaking: boolean }) {
  const group = useRef<THREE.Group>(null);
  const head = useRef<THREE.Mesh>(null);
  const mouth = useRef<THREE.Mesh>(null);

  useEffect(() => {
    return () => {
      if (group.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        group.current.traverse((obj: any) => {
          if (obj.isMesh) {
            obj.geometry.dispose();
            if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose());
            else obj.material.dispose();
          }
        });
      }
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) group.current.position.y = -1.2 + Math.sin(t * 2) * 0.05;
    if (mouth.current && isSpeaking) mouth.current.scale.y = 0.2 + Math.abs(Math.sin(t * 15)) * 0.8;
    if (head.current) head.current.rotation.y = state.mouse.x * 0.2;
  });

  return (
    <group ref={group}>
      <mesh position={[0, 0, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.5, 8, 16]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh ref={head} position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#ffdbac" metalness={0.1} roughness={0.8} />
        <mesh position={[-0.05, 0.03, 0.12]}>
          <sphereGeometry args={[0.02, 4, 4]} />
          <meshStandardMaterial color="#000" />
        </mesh>
        <mesh position={[0.05, 0.03, 0.12]}>
          <sphereGeometry args={[0.02, 4, 4]} />
          <meshStandardMaterial color="#000" />
        </mesh>
        <mesh ref={mouth} position={[0, -0.05, 0.14]}>
          <boxGeometry args={[0.04, 0.01, 0.01]} />
          <meshStandardMaterial color="#911" />
        </mesh>
      </mesh>
      <mesh position={[0, 0.55, -0.08]} rotation={[0.4, 0, 0]}>
        <sphereGeometry args={[0.17, 16, 8]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, 0.35, -0.2]}>
        <capsuleGeometry args={[0.04, 0.3, 4, 4]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
}

export default function VirtualInstructor() {
  // Global Dispose management
  useEffect(() => {
    return () => {
      THREE.Cache.clear();
    };
  }, []);

  return (
    <Suspense fallback={<ProfessionalFallback isSpeaking={false} />}>
      <PerspectiveCamera makeDefault position={[0, 0.3, 1.8]} fov={35} />
      <ambientLight intensity={1.5} />
      <spotLight position={[5, 10, 5]} angle={0.15} penumbra={1} intensity={2} castShadow />
      <directionalLight position={[-2, 5, 2]} intensity={1} />
      
      <InstructorModel />
      
      <ContactShadows resolution={1024} scale={6} blur={2.5} opacity={0.4} far={10} color="#000000" />
    </Suspense>
  );
}

// Pre-load the model
useGLTF.preload(MODEL_URL);
