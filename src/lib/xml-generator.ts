import { create, fragment } from "xmlbuilder2"
import type { IconPackAppDTO } from "@/types/icon-pack"

// === TYPES ===

export interface DrawableData {
  categories: Set<string>
  isNew: boolean
}

export type DrawableMapData = Map<string, DrawableData>

export interface AppfilterItem {
  packageName: string
  mainActivity: string
  drawable: string
}

// === SNIPPET GENERATORS (for clipboard copy) ===

/**
 * Generates appfilter XML snippet for clipboard.
 * Format: <item component="ComponentInfo{pkg/activity}" drawable="name"/>
 */
export function generateAppfilterSnippet(items: AppfilterItem[]): string {
  if (items.length === 0) return ""

  const frag = fragment()
  for (const item of items) {
    frag
      .ele("item")
      .att("component", `ComponentInfo{${item.packageName}/${item.mainActivity}}`)
      .att("drawable", item.drawable)
      .up()
  }

  return frag.end({ prettyPrint: true, indent: "" }).trim()
}

/**
 * Generates drawable XML snippet for clipboard.
 * Format: <item drawable="name" />
 */
export function generateDrawableSnippet(drawables: string[]): string {
  if (drawables.length === 0) return ""

  const frag = fragment()
  for (const drawable of drawables) {
    frag.ele("item").att("drawable", drawable).up()
  }

  return frag.end({ prettyPrint: true, indent: "" }).trim()
}

/**
 * Generates icon_pack XML snippet for clipboard.
 * Format: <item>drawable_name</item>
 */
export function generateIconPackSnippet(drawables: string[]): string {
  if (drawables.length === 0) return ""

  const frag = fragment()
  for (const drawable of drawables) {
    frag.ele("item").txt(drawable).up()
  }

  return frag.end({ prettyPrint: true, indent: "" }).trim()
}

// === FULL DOCUMENT GENERATORS (for ZIP export) ===

/**
 * Generates full appfilter.xml document.
 */
export function generateAppfilterXml(items: AppfilterItem[]): string {
  const doc = create({ version: "1.0", encoding: "utf-8" }).ele("appfilter")

  for (const item of items) {
    doc
      .ele("item")
      .att("component", `ComponentInfo{${item.packageName}/${item.mainActivity}}`)
      .att("drawable", item.drawable)
      .up()
  }

  return doc.end({ prettyPrint: true, indent: "\t" })
}

/**
 * Generates full drawable.xml document with categories.
 */
export function generateDrawableXml(
  drawableMap: DrawableMapData,
  sortedCategories: string[]
): string {
  const doc = create({ version: "1.0", encoding: "utf-8" }).ele("resources")

  // Add version element
  doc.ele("version").txt("1").up()

  // Helper to add a category section
  const addCategorySection = (title: string, drawables: string[]) => {
    doc.ele("category").att("title", title).up()
    for (const drawable of drawables) {
      doc.ele("item").att("drawable", drawable).up()
    }
  }

  // "New" category
  const newDrawables = Array.from(drawableMap.entries())
    .filter(([, data]) => data.isNew)
    .map(([drawable]) => drawable)
    .sort((a, b) => a.localeCompare(b))

  if (newDrawables.length > 0) {
    addCategorySection("New", newDrawables)
  }

  // Regular categories
  for (const categoryName of sortedCategories) {
    const categoryDrawables = Array.from(drawableMap.entries())
      .filter(([, data]) => data.categories.has(categoryName))
      .map(([drawable]) => drawable)
      .sort((a, b) => a.localeCompare(b))

    if (categoryDrawables.length > 0) {
      addCategorySection(categoryName, categoryDrawables)
    }
  }

  // "All" category
  const allDrawables = Array.from(drawableMap.keys()).sort((a, b) =>
    a.localeCompare(b)
  )
  addCategorySection("All", allDrawables)

  return doc.end({ prettyPrint: true, indent: "\t" })
}

/**
 * Generates full icon_pack.xml document with string-arrays.
 */
export function generateIconPackXml(
  drawableMap: DrawableMapData,
  sortedCategories: string[]
): string {
  const doc = create({ version: "1.0", encoding: "utf-8" })
    .ele("resources")
    .att("xmlns:tools", "http://schemas.android.com/tools")
    .att("tools:ignore", "ExtraTranslation")

  // Helper to add a string-array
  const addStringArray = (name: string, items: string[]) => {
    const arr = doc.ele("string-array").att("name", name)
    for (const item of items) {
      arr.ele("item").txt(item).up()
    }
    arr.up()
  }

  // Get all drawables sorted
  const allDrawables = Array.from(drawableMap.keys()).sort((a, b) =>
    a.localeCompare(b)
  )

  // Get new drawables
  const newDrawables = Array.from(drawableMap.entries())
    .filter(([, data]) => data.isNew)
    .map(([drawable]) => drawable)
    .sort((a, b) => a.localeCompare(b))

  // icons_preview - all drawables
  addStringArray("icons_preview", allDrawables)

  // icon_filters - list of filter names
  const filters = ["All"]
  if (newDrawables.length > 0) {
    filters.push("New")
  }
  filters.push(...sortedCategories)
  addStringArray("icon_filters", filters)

  // All category
  addStringArray("All", allDrawables)

  // New category (if any)
  if (newDrawables.length > 0) {
    addStringArray("New", newDrawables)
  }

  // Regular categories
  for (const categoryName of sortedCategories) {
    const categoryDrawables = Array.from(drawableMap.entries())
      .filter(([, data]) => data.categories.has(categoryName))
      .map(([drawable]) => drawable)
      .sort((a, b) => a.localeCompare(b))

    if (categoryDrawables.length > 0) {
      addStringArray(categoryName, categoryDrawables)
    }
  }

  return doc.end({ prettyPrint: true, indent: "\t" })
}

// === SHARED UTILITIES ===

/**
 * Builds a drawable map from icon pack apps.
 * Used by both generateDrawableXml and generateIconPackXml.
 */
export function buildDrawableMap(
  apps: IconPackAppDTO[],
  cutoffTimestamp?: number
): DrawableMapData {
  const drawableMap: DrawableMapData = new Map()

  for (const app of apps) {
    if (!app.drawable) continue

    const existing = drawableMap.get(app.drawable)
    const appDate = app.createdAt ? new Date(app.createdAt).getTime() : null
    const isNewApp =
      cutoffTimestamp !== undefined &&
      appDate !== null &&
      appDate > cutoffTimestamp

    if (existing) {
      for (const cat of app.categories ?? []) {
        existing.categories.add(cat)
      }
      if (isNewApp) {
        existing.isNew = true
      }
    } else {
      drawableMap.set(app.drawable, {
        categories: new Set(app.categories ?? []),
        isNew: isNewApp,
      })
    }
  }

  return drawableMap
}

/**
 * Extracts all unique categories from a drawable map, sorted alphabetically.
 */
export function extractCategories(drawableMap: DrawableMapData): string[] {
  const allCategories = new Set<string>()
  for (const { categories } of drawableMap.values()) {
    for (const cat of categories) {
      allCategories.add(cat)
    }
  }
  return Array.from(allCategories).sort((a, b) => a.localeCompare(b))
}
