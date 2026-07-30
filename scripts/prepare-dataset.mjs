import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = path.resolve(appRoot, '..')
const sourceRoot = path.join(repoRoot, 'outputs/sketch-keyframes-combined-40-pairs')
const sourceManifest = path.join(sourceRoot, 'manifest.json')
const datasetId = 'sketch-intent-40-pairs'
const targetRoot = path.join(appRoot, 'public/datasets', datasetId)
const targetConfig = path.join(appRoot, 'src/experiment/cases.generated.json')

const manifest = JSON.parse(await readFile(sourceManifest, 'utf8'))
if (manifest.instanceCount !== 80 || manifest.imagesPerInstance !== 4) {
  throw new Error(`Expected 80 cases with four images, received ${manifest.instanceCount}/${manifest.imagesPerInstance}`)
}

await rm(targetRoot, { recursive: true, force: true })
await mkdir(targetRoot, { recursive: true })

const cases = []
for (const entry of manifest.entries) {
  if (!Array.isArray(entry.files) || entry.files.length !== 4) {
    throw new Error(`${entry.instanceId} does not contain exactly four keyframes`)
  }
  const pairId = `${entry.taskId}, P${entry.participant.id}`
  const caseRoot = path.join(targetRoot, entry.instanceId)
  await mkdir(caseRoot, { recursive: true })
  const imagePaths = []
  for (const file of entry.files) {
    const source = path.join(sourceRoot, entry.instanceId, file.file)
    const target = path.join(caseRoot, file.file)
    await copyFile(source, target)
    imagePaths.push(`${entry.instanceId}/${file.file}`)
  }
  cases.push({ id: entry.instanceId, pairId, imagePaths })
}

cases.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
await writeFile(targetConfig, `${JSON.stringify(cases, null, 2)}\n`)

const copiedDirectories = await readdir(targetRoot)
console.log(`Prepared ${cases.length} blinded cases in ${copiedDirectories.length} directories.`)
