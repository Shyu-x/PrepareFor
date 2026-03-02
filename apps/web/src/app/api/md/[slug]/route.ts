import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const docsDir = path.join(process.cwd(), '../../前端面试题汇总')

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const filePath = path.join(docsDir, slug)

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  return NextResponse.json({ content })
}
