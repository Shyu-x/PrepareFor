const fs = require('fs')
const path = require('path')

const docs = [
  { file: '01-HTMLCSS面试题.md', title: 'HTML/CSS', section: 'core' },
  { file: '02-JavaScript面试题.md', title: 'JavaScript', section: 'core' },
  { file: '03-React面试题.md', title: 'React', section: 'framework' },
  { file: '04-手写代码题.md', title: '手写代码', section: 'core' },
  { file: '05-项目深挖问题.md', title: '项目深挖', section: 'project' },
  { file: '06-计算机网络面试题.md', title: '计算机网络', section: 'core' },
  { file: '07-Linux运维面试题.md', title: 'Linux运维', section: 'engineering' },
  { file: '08-前端工程化面试题.md', title: '前端工程化', section: 'engineering' },
  { file: '09-TypeScript面试题.md', title: 'TypeScript', section: 'framework' },
  { file: '10-实际工程应用问题.md', title: '工程应用', section: 'advanced' },
  { file: '11-Vue面试题.md', title: 'Vue', section: 'framework' },
  { file: '12-算法与数据结构.md', title: '算法与数据结构', section: 'advanced' },
]

const srcDir = __dirname
const outFile = path.join(srcDir, 'index.html')

// 读取 md
function readMd(fn) {
  const fp = path.join(srcDir, fn)
  if (!fs.existsSync(fp)) return ''
  const content = fs.readFileSync(fp, 'utf-8')
  // 转义 HTML 特殊字符，避免被浏览器解析
  return content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// 分类
const secs = { core: { t: '核心基础 (P0)', i: [] }, framework: { t: '框架技术 (P1)', i: [] }, engineering: { t: '工程能力 (P2)', i: [] }, advanced: { t: '进阶能力 (P2)', i: [] }, project: { t: '项目经验', i: [] } }
docs.forEach(d => { if (secs[d.section]) secs[d.section].i.push(d) })

// 侧边栏
let side = ''
Object.values(secs).forEach(s => {
  if (s.i.length === 0) return
  side += `<div class="ns"><div class="nt">${s.t}</div>`
  s.i.forEach(d => {
    side += `<div class="ni" id="nav-${d.file}">${d.title}</div>`
  })
  side += '</div>'
})

// 文档
let docsHtml = ''
docs.forEach(d => {
  const id = 'doc-' + d.file.replace('.md', '')
  docsHtml += `<div class="ds" id="${id}"><div class="mc">${readMd(d.file)}</div></div>`
})

// 卡片
const colors = { core: '#3b82f6', framework: '#8b5cf6', engineering: '#10b981', advanced: '#f59e0b', project: '#ef4444' }
let cards = docs.map(d => {
  const c = colors[d.section] || '#666'
  return `<div class="cd" id="card-${d.file}">
    <div class="ci" style="background:${c}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
    </div>
    <div class="ct">${d.title}</div>
  </div>`
}).join('')

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>前端面试题库</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown.min.css">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#f5f5f5}
.app{display:flex;min-height:100vh}
.sb{width:200px;background:#fff;border-right:1px solid #ddd;position:fixed;height:100vh;overflow-y:auto;transition:width .3s;z-index:100}
.sb.collapsed{width:0;overflow:hidden}
.sh{padding:16px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;display:flex;align-items:center;justify-content:space-between}
.st{font-weight:600;font-size:14px}
.tb{background:rgba(255,255,255,.2);border:none;color:#fff;width:24px;height:24px;border-radius:4px;cursor:pointer}
.ns{padding:8px 0;border-bottom:1px solid #f0f0f0}
.nt{font-size:10px;color:#999;padding:8px 16px 4px;text-transform:uppercase}
.ni{padding:10px 16px;color:#555;cursor:pointer;font-size:13px}
.ni:hover{background:#f0f7ff;color:#2563eb}
.ni.active{background:#2563eb;color:#fff}
.mn{flex:1;margin-left:200px;padding:20px;transition:margin .3s}
.sb.collapsed~.mn{margin-left:0}
.ds{display:none}
.ds.active{display:block}
.mc{background:#fff;padding:24px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.1)}
pre{background:#1e1e1e!important;border-radius:6px;overflow-x:auto}
code{font-family:monospace;font-size:13px}
pre code{background:transparent!important}
.hg{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:20px}
.cd{background:#fff;padding:16px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.1);cursor:pointer}
.cd:hover{background:#f8f9fa}
.ci{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:8px}
.ci svg{width:18px;height:18px;color:#fff}
.ct{font-size:13px;font-weight:600;color:#333}
</style>
</head>
<body>
<div class="app">
<aside class="sb" id="sb">
<div class="sh"><span class="st">前端面试题库</span><button class="tb" id="tb">☰</button></div>
<nav>${side}</nav>
</aside>
<main class="mn" id="mn">
<div class="ds active" id="doc-index">
<div class="hg">${cards}</div>
<div class="mc"><h1>前端面试题库</h1><p>共 ${docs.length} 个面试题文档，点击上方卡片或左侧导航查看。</p></div>
</div>
${docsHtml}
</main>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/marked/11.1.1/marked.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<script>
marked.setOptions({highlight:function(c,l){return l&&hljs.getLanguage(l)?hljs.highlight(c,{language:l}).value:hljs.highlightAuto(c).value},gfm:true,breaks:true})
document.querySelectorAll('.mc').forEach(function(el){var t=el.textContent||el.innerText;el.innerHTML='<div class="markdown-body">'+marked.parse(t)+'</div>'})

var cur='index'
function show(n){
document.querySelectorAll('.ds').forEach(function(e){e.classList.remove('active')})
document.querySelectorAll('.ni').forEach(function(e){e.classList.remove('active')})
var d=document.getElementById('doc-'+n)
if(d)d.classList.add('active')
var nav=document.getElementById('nav-'+n)
if(nav)nav.classList.add('active')
cur=n
window.scrollTo(0,0)}
document.getElementById('tb').onclick=function(){document.getElementById('sb').classList.toggle('collapsed')}
document.querySelectorAll('.ni').forEach(function(e){e.onclick=function(){show(this.id.replace('nav-',''))}})
document.querySelectorAll('.cd').forEach(function(e){e.onclick=function(){show(this.id.replace('card-',''))}})
</script>
</body>
</html>`

fs.writeFileSync(outFile, html, 'utf-8')
console.log('OK:', outFile)
