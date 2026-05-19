import { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';


const AVATAR_URL = 'https://models.readyplayer.me/6584288018e69818816827a5.glb?morphTargets=ARKit,Oculus%20Visemes';

function AvatarRemote() {
  const group = useRef<THREE.Group>(null);
  const { nodes, materials, animations } = useGLTF(AVATAR_URL) as any;
  const { actions, names } = useAnimations(animations, group);
  const isSpeaking = false;

  const headMesh = useMemo(() => {
    let mesh: any = null;
    if (nodes) {
      Object.values(nodes).forEach((node: any) => {
        if (node.type === 'SkinnedMesh' && node.morphTargetDictionary) {
          if (node.name.includes('Head') || node.name.includes('Avatar')) {
            mesh = node;
          }
        }
      });
    }
    return mesh;
  }, [nodes]);

  useEffect(() => {
    if (actions && names.length > 0) {
      const idleName = names.find(n => n.toLowerCase().includes('idle')) || names[0];
      const animationAction = actions[idleName];
      if (animationAction) {
        animationAction.reset().fadeIn(0.5).play();
      }
    }
  }, [actions, names]);

  useFrame((state) => {
    if (group.current) {
        group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
        group.current.position.y = -1.6 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
    }

    if (headMesh) {
      const dict = headMesh.morphTargetDictionary;
      const influences = headMesh.morphTargetInfluences;
      if (dict && influences) {
        // Eye Blink
        const bl = dict['eyeBlinkLeft'] || dict['EyeBlinkLeft'];
        const br = dict['eyeBlinkRight'] || dict['EyeBlinkRight'];
        const bv = Math.sin(state.clock.elapsedTime * 5) > 0.98 ? 1 : 0;
        if (bl !== undefined) influences[bl] = THREE.MathUtils.lerp(influences[bl], bv, 0.2);
        if (br !== undefined) influences[br] = THREE.MathUtils.lerp(influences[br], bv, 0.2);

        // Lip Sync / Mouth Open
        const mo = dict['mouthOpen'] || dict['MouthOpen'] || dict['viseme_aa'] || dict['jawOpen'];
        const si = isSpeaking ? Math.abs(Math.sin(state.clock.elapsedTime * 15)) * 0.8 : 0;
        if (mo !== undefined) influences[mo] = THREE.MathUtils.lerp(influences[mo], si, 0.3);
      }
    }
  });

  return (
    <group ref={group} dispose={null} position={[0, -1.6, 0]} scale={1}>
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

function AvatarFallback() {
  const headRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const isSpeaking = false; // Dummy

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (headRef.current) {
        headRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
        headRef.current.rotation.x = Math.sin(time * 0.3) * 0.05;
    }

    if (bodyRef.current) {
        bodyRef.current.position.y = Math.sin(time * 2) * 0.02 - 0.4;
        bodyRef.current.rotation.z = Math.sin(time * 1.5) * 0.02;
    }
    
    if (mouthRef.current && isSpeaking) {
        const s = Math.abs(Math.sin(time * 15)) * 0.8 + 0.2;
        mouthRef.current.scale.y = s;
    } else if (mouthRef.current) {
        mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, 0.1, 0.1);
    }
  });

  return (
    <group position={[0, -0.4, 0]}>
      {/* Body / Torso (Female profile) */}
      <group ref={bodyRef}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.25, 0.5, 8, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.1} roughness={0.7} />
        </mesh>
        {/* Arms */}
        <mesh position={[-0.35, 0, 0]} rotation={[0, 0, 0.2]}>
          <capsuleGeometry args={[0.06, 0.4, 4, 8]} />
          <meshStandardMaterial color="#fcd34d" />
        </mesh>
        <mesh position={[0.35, 0, 0]} rotation={[0, 0, -0.2]}>
          <capsuleGeometry args={[0.06, 0.4, 4, 8]} />
          <meshStandardMaterial color="#fcd34d" />
        </mesh>
      </group>
      
      {/* Head */}
      <group ref={headRef} position={[0, 0.35, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.28, 32, 32]} />
          <meshStandardMaterial color="#fcd34d" metalness={0.05} roughness={0.9} />
          
          {/* Hair (Feminine style) */}
          <mesh position={[0, 0.1, -0.05]} rotation={[0.4, 0, 0]}>
              <sphereGeometry args={[0.3, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
              <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0.2, -0.1, -0.1]} rotation={[0, 0, -0.2]}>
              <capsuleGeometry args={[0.1, 0.3, 4, 8]} />
              <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[-0.2, -0.1, -0.1]} rotation={[0, 0, 0.2]}>
              <capsuleGeometry args={[0.1, 0.3, 4, 8]} />
              <meshStandardMaterial color="#1e293b" />
          </mesh>
          
          {/* Eyes */}
          <mesh position={[-0.1, 0.05, 0.22]}>
              <sphereGeometry args={[0.035, 16, 16]} />
              <meshStandardMaterial color="#000" />
          </mesh>
          <mesh position={[0.1, 0.05, 0.22]}>
              <sphereGeometry args={[0.035, 16, 16]} />
              <meshStandardMaterial color="#000" />
          </mesh>
          
          {/* Mouth */}
          <mesh ref={mouthRef} position={[0, -0.1, 0.25]}>
              <boxGeometry args={[0.1, 0.06, 0.03]} />
              <meshStandardMaterial color="#be123c" />
          </mesh>
        </mesh>
      </group>
    </group>
  );
}

export default function Avatar3D() {
    const [loadError, setLoadError] = useState(false);
    const [hasInternet, setHasInternet] = useState(true);

    useEffect(() => {
        const checkInternet = async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                await fetch('https://models.readyplayer.me/ready.png', { mode: 'no-cors', signal: controller.signal });
                clearTimeout(timeoutId);
                setHasInternet(true);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
                setHasInternet(false);
                setLoadError(true);
            }
        };
        checkInternet();
    }, []);

    if (loadError || !hasInternet) return <AvatarFallback />;

    return (
        <Suspense fallback={<AvatarFallback />}>
            <AvatarRemote />
        </Suspense>
    );
}
