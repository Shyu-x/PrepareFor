const fs = require('fs')
const path = require('path')
const { marked } = require('marked')
const https = require('https')

// Configure marked
marked.setOptions({
  gfm: true,
  breaks: true,
})

const docsDir = path.join(__dirname, '../../../前端面试题汇总')
const outputDir = path.join(__dirname, '../src/data')

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

const docs = [
  { key: 'html-css', file: '01-HTMLCSS面试题.md' },
  { key: 'javascript', file: '02-JavaScript面试题.md' },
  { key: 'react', file: '03-React面试题.md' },
  { key: 'vue', file: '11-Vue面试题.md' },
  { key: 'typescript', file: '09-TypeScript面试题.md' },
  { key: 'network', file: '06-计算机网络面试题.md' },
  { key: 'linux', file: '07-Linux运维面试题.md' },
  { key: 'engineering', file: '08-前端工程化面试题.md' },
  { key: 'algorithm', file: '12-算法与数据结构.md' },
  { key: 'project', file: '05-项目深挖问题.md' },
]

// PlantUML encoding (PlantUML uses a specific encoding format)
// 1. UTF-8 encode
// 2. Deflate compress
// 3. Convert to base64url (PlantUML's special base64)
function encodePlantUml(code) {
  const zlib = require('zlib')

  // Add PlantUML header
  let plantumlCode = code.trim()
  if (!plantumlCode.includes('@startuml')) {
    plantumlCode = '@startuml\n' + plantumlCode + '\n@enduml'
  }
  plantumlCode = plantumlCode.replace(/@startuml/, '@startuml\nskinparam backgroundColor #FEFEFE\n')

  // UTF-8 encode
  const utf8Buffer = Buffer.from(plantumlCode, 'utf8')

  // Deflate compress
  const compressed = zlib.deflateSync(utf8Buffer, { level: 9 })

  // PlantUML uses "at" sign encoding (encodes each byte as 6 bits)
  // This is PlantUML's specific base64 variant called "SB64"
  return encodeSB64(compressed)
}

// PlantUML's specific base64url-like encoding
function encodeSB64(buffer) {
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

function decodeHtmlEntities(str) {
  return str.replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
}

// Download PlantUML SVG
function downloadPlantUML(code) {
  return new Promise((resolve, reject) => {
    const encoded = encodePlantUml(code)
    const url = `https://www.plantuml.com/plantuml/svg/~1${encoded}`

    https.get(url, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        if (data.includes('404 Not Found') || data.length < 100) {
          reject(new Error('Invalid PlantUML code'))
        } else {
          resolve(data)
        }
      })
    }).on('error', reject)
  })
}

// Process content and render PlantUML
async function processContent(content) {
  // Parse markdown first
  let html = marked.parse(content)

  // Replace PlantUML code blocks with rendered SVG
  const plantumlRegex = /<pre><code class="language-plantuml">([\s\S]*?)<\/code><\/pre>/g

  // For now, replace with a placeholder that will be rendered on client
  html = html.replace(plantumlRegex, (match, code) => {
    try {
      const decodedCode = decodeHtmlEntities(code.trim())
      const encoded = encodePlantUml(decodedCode)
      return `<div class="plantuml-diagram" data-code="${encoded}" style="margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center;">
        <img src="https://www.plantuml.com/plantuml/svg/~1${encoded}" alt="PlantUML Diagram" style="max-width: 100%;" />
      </div>`
    } catch (e) {
      console.error('PlantUML encoding error:', e.message)
      return `<div class="plantuml-diagram" style="margin: 20px 0; padding: 20px; background: #fff5f5; border-radius: 8px; border: 1px solid #ffccc7;">
        <p style="color: #ff4d4f;">Diagram rendering failed</p>
      </div>`
    }
  })

  return html
}

const data = {}

async function processAllDocs() {
  for (const doc of docs) {
    const filePath = path.join(docsDir, doc.file)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      try {
        const html = await processContent(content)
        data[doc.key] = html
        console.log(`✓ Processed: ${doc.file}`)
      } catch (e) {
        // If PlantUML fails, just use markdown
        const html = marked.parse(content)
        data[doc.key] = html
        console.log(`⚠ Processed with warnings: ${doc.file}`)
      }
    } else {
      console.log(`✗ Missing: ${doc.file}`)
    }
  }

  // Write JSON file
  fs.writeFileSync(
    path.join(outputDir, 'docs.json'),
    JSON.stringify(data, null, 2),
    'utf-8'
  )

  console.log(`\n✓ Pre-rendered ${Object.keys(data).length} documents to ${outputDir}/docs.json`)
}

processAllDocs()
