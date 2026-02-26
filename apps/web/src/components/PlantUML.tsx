'use client'

import { useEffect, useState } from 'react'

interface PlantUMLProps {
  code: string
}

// PlantUML's specific base64url-like encoding (same as server)
function encodeSB64(buffer: Uint8Array): string {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'
  let result = ''
  let bits = 0
  let bitsCount = 0

  for (let i = 0; i < buffer.length; i++) {
    bits = (bits << 8) | buffer[i]
    bitsCount += 8

    while (bitsCount >= 6) {
      bitsCount -= 6
      const index = (bits >> bitsCount) & 0x3F
      result += alphabet[index]
    }
  }

  // Handle remaining bits
  if (bitsCount > 0) {
    bits <<= (6 - bitsCount)
    const index = bits & 0x3F
    result += alphabet[index]
  }

  return result
}

function encodePlantUML(code: string): string {
  // Add PlantUML header if not present
  let plantumlCode = code.trim()
  if (!plantumlCode.includes('@startuml')) {
    plantumlCode = '@startuml\nskinparam backgroundColor #FEFEFE\n' + plantumlCode + '\n@enduml'
  } else if (!plantumlCode.includes('skinparam backgroundColor')) {
    plantumlCode = plantumlCode.replace('@startuml', '@startuml\nskinparam backgroundColor #FEFEFE')
  }

  // UTF-8 encode
  const utf8Encoder = new TextEncoder()
  const utf8Buffer = utf8Encoder.encode(plantumlCode)

  // Deflate compress using CompressionStream API
  // Since we can't use CompressionStream synchronously, we'll use a workaround
  // by encoding to base64 first then using the plantuml.com API format
  // Actually, let's use a simpler approach - the plantuml.com API accepts different encodings

  // Try using the plantuml text encoding approach
  // PlantUML also supports direct text encoding with ~1 prefix
  // For now, let's use the simple URL encoding approach that works

  // Use async compression
  return encodeWithCompression(plantumlCode)
}

async function encodeWithCompression(code: string): Promise<string> {
  const utf8Encoder = new TextEncoder()
  const data = utf8Encoder.encode(code)

  // Use CompressionStream to deflate
  const cs = new CompressionStream('deflate')
  const writer = cs.writable.getWriter()
  writer.write(data)
  writer.close()

  const reader = cs.readable.getReader()
  const chunks: Uint8Array[] = []

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }

  // Concatenate all chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }

  return encodeSB64(result)
}

export default function PlantUML({ code }: PlantUMLProps) {
  const [svgUrl, setSvgUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function renderPlantUML() {
      try {
        setLoading(true)

        // Add header if needed
        let plantumlCode = code.trim()
        if (!plantumlCode.includes('@startuml')) {
          plantumlCode = '@startuml\nskinparam backgroundColor #FEFEFE\n' + plantumlCode + '\n@enduml'
        } else if (!plantumlCode.includes('skinparam backgroundColor')) {
          plantumlCode = plantumlCode.replace('@startuml', '@startuml\nskinparam backgroundColor #FEFEFE')
        }

        // Use the plantuml.com API with proper encoding
        const encoded = await encodeWithCompression(plantumlCode)
        const url = `https://www.plantuml.com/plantuml/svg/~1${encoded}`

        setSvgUrl(url)
        setError('')
      } catch (e) {
        setError('渲染图表失败')
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    if (code) {
      renderPlantUML()
    }
  }, [code])

  if (loading) {
    return (
      <div style={{
        padding: 40,
        textAlign: 'center',
        background: '#f8f9fa',
        borderRadius: 8,
        color: '#666'
      }}>
        Loading diagram...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        padding: 20,
        background: '#fff5f5',
        border: '1px solid #ffccc7',
        borderRadius: 8,
        color: '#ff4d4f'
      }}>
        {error}
      </div>
    )
  }

  return (
    <div style={{
      margin: '20px 0',
      padding: 16,
      background: '#fff',
      borderRadius: 12,
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      overflow: 'auto'
    }}>
      <img
        src={svgUrl}
        alt="PlantUML Diagram"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  )
}

// Parse PlantUML blocks from markdown content
export function parsePlantUML(content: string): string {
  // Replace ```plantuml blocks with PlantUML component placeholder
  const plantumlRegex = /```plantuml\n([\s\S]*?)```/g

  return content.replace(plantumlRegex, (match, code) => {
    const encoded = encodeURIComponent(code.trim())
      .replace(/\+/g, '%2B')
      .replace(/\//g, '%2F')
      .replace(/=/g, '%3D')

    return `<div class="plantuml-container" data-code="${encoded}"></div>`
  })
}
