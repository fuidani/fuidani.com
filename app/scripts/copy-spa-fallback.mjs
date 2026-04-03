import { copyFile, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(currentDir, '..', 'dist')
const indexPath = path.join(distDir, 'index.html')
const fallbackPath = path.join(distDir, '404.html')

async function main() {
  await access(indexPath)
  await copyFile(indexPath, fallbackPath)
  console.log('Copied dist/index.html to dist/404.html for GitHub Pages SPA fallback.')
}

main().catch((error) => {
  console.error('Failed to generate 404.html fallback.', error)
  process.exitCode = 1
})
