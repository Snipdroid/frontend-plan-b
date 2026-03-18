import { parseAppFilterXml } from "@/lib/appfilter-parser"
import { parseIconPackCategoryXml } from "@/lib/icon-pack-category-parser"
import {
  getFileTextAtRelativePath,
  hasDirectoryAtRelativePath,
  hasFileAtRelativePath,
  listPngDrawableEntries,
} from "@/lib/fs-access"
import type {
  AppMapping,
  AppMappingDraft,
  StructureCheckItem,
} from "@/types/studio"

export const GRADLE_FILE_CANDIDATES = ["build.gradle", "build.gradle.kts"]

export const STRUCTURE_REQUIRED_FILES = [
  "app/src/main/res/xml/appfilter.xml",
  "app/src/main/res/xml/drawable.xml",
  "app/src/main/res/values/icon_pack.xml",
]

export const STRUCTURE_REQUIRED_DIRECTORIES = ["app/src/main/res/drawable-nodpi"]

export const STRUCTURE_OPTIONAL_FILES = [
  "app/src/main/assets/appfilter.xml",
  "app/src/main/assets/drawable.xml",
]

export const STRUCTURE_DRAWABLE_DIRECTORY = "app/src/main/res/drawable-nodpi"

export const APPFILTER_SOURCE_PATHS = [
  "app/src/main/res/xml/appfilter.xml",
  "app/src/main/assets/appfilter.xml",
]

export const CATEGORY_SOURCE_PATHS = [
  "app/src/main/res/xml/drawable.xml",
  "app/src/main/assets/drawable.xml",
  "app/src/main/res/values/icon_pack.xml",
]

const normalizeActivityName = (packageName: string, activityName: string) => {
  if (!activityName) return ""
  if (activityName.startsWith(".")) return `${packageName}${activityName}`
  if (activityName.includes(".")) return activityName
  return `${packageName}.${activityName}`
}

export const parseCategoryString = (raw: string) =>
  raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)

export const formatCategoryString = (categories: string[]) => categories.join(", ")

export const createMappingDraft = (
  packageName: string,
  activityName: string,
  id: string,
): AppMappingDraft => ({
  id,
  packageName,
  activityName,
})

export const buildAppMappingsByDrawable = (entries: ReturnType<typeof parseAppFilterXml>) => {
  const mappingsByDrawable: Record<string, AppMapping[]> = {}

  for (const entry of entries) {
    const drawableName = entry.drawableName?.trim().toLowerCase()
    if (!drawableName) continue

    const packageName = entry.packageName?.trim() || ""
    const activityName = normalizeActivityName(packageName, entry.mainActivity?.trim() || "")
    const componentRaw = packageName && entry.mainActivity
      ? `ComponentInfo{${packageName}/${entry.mainActivity}}`
      : ""

    const mapping: AppMapping = {
      packageName,
      activityName,
      componentRaw,
    }

    const current = mappingsByDrawable[drawableName] || []
    const signature = `${mapping.packageName}::${mapping.activityName}::${mapping.componentRaw}`
    const exists = current.some((item) => {
      const itemSignature = `${item.packageName}::${item.activityName}::${item.componentRaw}`
      return itemSignature === signature
    })

    if (!exists) {
      current.push(mapping)
      mappingsByDrawable[drawableName] = current
    }
  }

  return mappingsByDrawable
}

export const buildCategoriesByDrawable = (categoryToDrawables: Record<string, string[]>) => {
  const categoriesByDrawable: Record<string, string[]> = {}

  for (const [categoryName, drawableNames] of Object.entries(categoryToDrawables)) {
    for (const drawableNameRaw of drawableNames) {
      const drawableName = drawableNameRaw.trim().toLowerCase()
      if (!drawableName) continue

      const categories = categoriesByDrawable[drawableName] || []
      if (!categories.includes(categoryName)) {
        categories.push(categoryName)
      }
      categoriesByDrawable[drawableName] = categories
    }
  }

  return categoriesByDrawable
}

export const scanStructure = async (rootDirectoryHandle: FileSystemDirectoryHandle) => {
  const hasGradleFile = await Promise.all(
    GRADLE_FILE_CANDIDATES.map((fileName) =>
      hasFileAtRelativePath(rootDirectoryHandle, fileName)
    )
  ).then((results) => results.some(Boolean))

  const requiredFileChecks = await Promise.all(
    STRUCTURE_REQUIRED_FILES.map(async (relativePath) => ({
      relativePath,
      kind: "file" as const,
      required: true,
      exists: await hasFileAtRelativePath(rootDirectoryHandle, relativePath),
    }))
  )

  const requiredDirectoryChecks = await Promise.all(
    STRUCTURE_REQUIRED_DIRECTORIES.map(async (relativePath) => ({
      relativePath,
      kind: "directory" as const,
      required: true,
      exists: await hasDirectoryAtRelativePath(rootDirectoryHandle, relativePath),
    }))
  )

  const requiredChecks: StructureCheckItem[] = [
    {
      relativePath: "build.gradle | build.gradle.kts",
      kind: "file",
      required: true,
      exists: hasGradleFile,
    },
    ...requiredFileChecks,
    ...requiredDirectoryChecks,
  ]

  const optionalChecks: StructureCheckItem[] = await Promise.all(
    STRUCTURE_OPTIONAL_FILES.map(async (relativePath) => ({
      relativePath,
      kind: "file" as const,
      required: false,
      exists: await hasFileAtRelativePath(rootDirectoryHandle, relativePath),
    }))
  )

  const drawableEntries = await listPngDrawableEntries(
    rootDirectoryHandle,
    STRUCTURE_DRAWABLE_DIRECTORY
  )
  const drawablePngCount = drawableEntries.length

  const appfilterXmlText = await Promise.any(
    APPFILTER_SOURCE_PATHS.map(async (path) => {
      const content = await getFileTextAtRelativePath(rootDirectoryHandle, path)
      if (!content) {
        throw new Error("not found")
      }
      return content
    })
  ).catch(() => null)

  const categoryXmlText = await Promise.any(
    CATEGORY_SOURCE_PATHS.map(async (path) => {
      const content = await getFileTextAtRelativePath(rootDirectoryHandle, path)
      if (!content) {
        throw new Error("not found")
      }
      return content
    })
  ).catch(() => null)

  const appMappingsByDrawable = appfilterXmlText
    ? buildAppMappingsByDrawable(parseAppFilterXml(appfilterXmlText))
    : {}
  const categoriesByDrawable = categoryXmlText
    ? buildCategoriesByDrawable(parseIconPackCategoryXml(categoryXmlText).categoryToDrawables)
    : {}

  return {
    requiredChecks,
    optionalChecks,
    drawablePngCount,
    drawableEntries,
    appMappingsByDrawable,
    categoriesByDrawable,
  }
}
