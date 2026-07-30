import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const configPath = path.join(appRoot, 'src/experiment/cases.generated.json')
const datasetRoot = path.join(appRoot, 'public/datasets/sketch-intent-40-pairs')
const forbiddenKeys = new Set(['effect', 'taskDescription', 'targets', 'groundTruth', 'animationUnit'])
const cases = JSON.parse(await readFile(configPath, 'utf8'))

function assertBlinded(value, context) {
  if (Array.isArray(value)) return value.forEach((child, index) => assertBlinded(child, `${context}.${index}`))
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) throw new Error(`Forbidden answer-bearing key at ${context}.${key}`)
    assertBlinded(child, `${context}.${key}`)
  }
}

if (!Array.isArray(cases) || cases.length !== 80) throw new Error(`Expected 80 cases, found ${cases.length}`)
assertBlinded(cases, 'cases')
const ids = new Set()
for (const item of cases) {
  if (ids.has(item.id)) throw new Error(`Duplicate case ID: ${item.id}`)
  ids.add(item.id)
  if (!item.pairId || !Array.isArray(item.imagePaths) || item.imagePaths.length !== 4) {
    throw new Error(`Invalid case shape: ${item.id}`)
  }
  for (const imagePath of item.imagePaths) {
    if (path.isAbsolute(imagePath) || imagePath.split(/[\\/]/).includes('..')) throw new Error(`Unsafe image path in ${item.id}: ${imagePath}`)
    await access(path.join(datasetRoot, imagePath))
  }
}
console.log(`Validated ${cases.length} blinded cases and ${cases.length * 4} keyframes.`)
