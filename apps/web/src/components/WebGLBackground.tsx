'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

export default function WebGLBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [webglSupported, setWebglSupported] = useState(true)

  useEffect(() => {
    // Check WebGL support
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (!gl) {
        setWebglSupported(false)
        return
      }
    } catch (e) {
      setWebglSupported(false)
      return
    }

    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    if (width === 0 || height === 0) return

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.z = 30

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // GLSL Vertex Shader - Animated wave distortion
    const vertexShader = `
      varying vec2 vUv;
      varying float vDistortion;
      uniform float uTime;

      void main() {
        vUv = uv;
        vec3 pos = position;

        // Multi-layer wave distortion
        float dist = sin(pos.x * 0.3 + uTime * 0.4) * cos(pos.y * 0.4 + uTime * 0.3) * 1.5;
        dist += sin(pos.x * 0.5 + pos.y * 0.5 + uTime * 0.2) * 0.8;
        pos.z += dist;
        vDistortion = dist;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = 2.5;
      }
    `

    // GLSL Fragment Shader - Color gradient particles
    const fragmentShader = `
      varying vec2 vUv;
      varying float vDistortion;
      uniform float uTime;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;

      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;

        float alpha = 1.0 - smoothstep(0.2, 0.5, dist);

        // Dynamic color mixing
        vec3 color = mix(uColor1, uColor2, sin(uTime * 0.4 + vUv.x * 3.14159 * 2.0) * 0.5 + 0.5);
        color = mix(color, uColor3, cos(uTime * 0.3 + vUv.y * 3.14159) * 0.4 + 0.2);

        // Add sparkle effect
        float sparkle = sin(uTime * 3.0 + vDistortion * 10.0) * 0.3 + 0.7;
        color *= sparkle;

        gl_FragColor = vec4(color, alpha * 0.5);
      }
    `

    // Create particles with BufferGeometry
    const particleCount = 3000
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const uvs = new Float32Array(particleCount * 2)

    for (let i = 0; i < particleCount; i++) {
      // Distribute particles in a more interesting pattern
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 20 + Math.random() * 30

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50

      uvs[i * 2] = Math.random()
      uvs[i * 2 + 1] = Math.random()
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color('#0891B2') }, // Cyan 600
        uColor2: { value: new THREE.Color('#0ea5e9') }, // Sky 500
        uColor3: { value: new THREE.Color('#22D3EE') }, // Cyan 400
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

    // Add floating torus rings
    const torusGeometry = new THREE.TorusGeometry(12, 0.2, 16, 100)
    const torusMaterial = new THREE.MeshBasicMaterial({
      color: 0x0891B2,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    })

    const torus1 = new THREE.Mesh(torusGeometry, torusMaterial)
    torus1.rotation.x = Math.PI / 3
    scene.add(torus1)

    const torus2 = new THREE.Mesh(torusGeometry.clone(), torusMaterial.clone())
    torus2.rotation.x = -Math.PI / 4
    torus2.rotation.y = Math.PI / 4
    torus2.scale.set(0.7, 0.7, 0.7)
    scene.add(torus2)

    // Animation loop
    let animationId: number
    const clock = new THREE.Clock()

    const animate = () => {
      animationId = requestAnimationFrame(animate)

      const elapsedTime = clock.getElapsedTime()
      material.uniforms.uTime.value = elapsedTime

      // Rotate particles slowly
      particles.rotation.y = elapsedTime * 0.03
      particles.rotation.x = Math.sin(elapsedTime * 0.1) * 0.05

      // Rotate tori
      torus1.rotation.z = elapsedTime * 0.08
      torus1.rotation.x = Math.PI / 3 + Math.sin(elapsedTime * 0.2) * 0.1

      torus2.rotation.z = -elapsedTime * 0.1
      torus2.rotation.y = Math.PI / 4 + Math.cos(elapsedTime * 0.15) * 0.1

      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const handleResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      if (w === 0 || h === 0) return
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [webglSupported])

  // CSS fallback if WebGL not supported
  if (!webglSupported) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(135deg, #ECFEFF 0%, #CFFAFE 50%, #A5F3FC 100%)',
          opacity: 0.4,
        }}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
