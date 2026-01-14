export type IconPackCategorySourceType = "drawable" | "icon_pack"

export interface ParsedCategoryXml {
  sourceType: IconPackCategorySourceType
  categoryToDrawables: Record<string, string[]>
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values))
}

function normalizeDrawableName(drawableName: string): string {
  return drawableName.trim().toLowerCase()
}

export function parseDrawableXmlCategories(xmlContent: string): ParsedCategoryXml {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlContent, "text/xml")

  const parserError = xmlDoc.querySelector("parsererror")
  if (parserError) {
    throw new Error(`XML parsing error: ${parserError.textContent}`)
  }

  const root = xmlDoc.documentElement
  if (!root || root.tagName !== "resources") {
    throw new Error("Invalid drawable.xml: missing <resources> root")
  }

  const categoryToDrawables: Record<string, string[]> = {}
  let currentCategory: string | null = null

  // Our exported drawable.xml relies on ordering: <category/> followed by <item drawable="..."/>
  // We parse direct children in order to correctly associate items with categories.
  for (const child of Array.from(root.children)) {
    if (child.tagName === "category") {
      const title = child.getAttribute("title")?.trim()
      if (title) {
        currentCategory = title
        if (!categoryToDrawables[currentCategory]) {
          categoryToDrawables[currentCategory] = []
        }
      } else {
        currentCategory = null
      }
      continue
    }

    if (child.tagName === "item") {
      if (!currentCategory) continue
      const drawable = child.getAttribute("drawable")
      if (!drawable) continue
      const normalized = normalizeDrawableName(drawable)
      if (!normalized) continue
      categoryToDrawables[currentCategory].push(normalized)
    }
  }

  for (const key of Object.keys(categoryToDrawables)) {
    categoryToDrawables[key] = uniqueStrings(categoryToDrawables[key])
  }

  return { sourceType: "drawable", categoryToDrawables }
}

export function parseIconPackXmlCategories(xmlContent: string): ParsedCategoryXml {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlContent, "text/xml")

  const parserError = xmlDoc.querySelector("parsererror")
  if (parserError) {
    throw new Error(`XML parsing error: ${parserError.textContent}`)
  }

  const root = xmlDoc.documentElement
  if (!root || root.tagName !== "resources") {
    throw new Error("Invalid icon_pack.xml: missing <resources> root")
  }

  const categoryToDrawables: Record<string, string[]> = {}
  const arrays = Array.from(root.querySelectorAll("string-array"))

  for (const arr of arrays) {
    const name = arr.getAttribute("name")?.trim()
    if (!name) continue
    if (name === "icons_preview" || name === "icon_filters") continue

    const items = Array.from(arr.querySelectorAll("item"))
      .map((item) => normalizeDrawableName(item.textContent ?? ""))
      .filter(Boolean)

    if (items.length > 0) {
      categoryToDrawables[name] = uniqueStrings(items)
    }
  }

  return { sourceType: "icon_pack", categoryToDrawables }
}

export function parseIconPackCategoryXml(xmlContent: string): ParsedCategoryXml {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlContent, "text/xml")

  const parserError = xmlDoc.querySelector("parsererror")
  if (parserError) {
    throw new Error(`XML parsing error: ${parserError.textContent}`)
  }

  const root = xmlDoc.documentElement
  if (!root) {
    throw new Error("Invalid XML: missing root element")
  }

  const hasCategory = root.querySelector("category") !== null
  const hasStringArray = root.querySelector("string-array") !== null

  if (hasCategory && hasStringArray) {
    throw new Error(
      "Unsupported XML: contains both <category> and <string-array> structures"
    )
  }

  if (hasCategory) {
    return parseDrawableXmlCategories(xmlContent)
  }

  if (hasStringArray) {
    return parseIconPackXmlCategories(xmlContent)
  }

  throw new Error(
    "Unsupported XML: expected drawable.xml (<category>) or icon_pack.xml (<string-array>)"
  )
}

