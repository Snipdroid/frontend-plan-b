import { Badge } from "@/components/ui/badge"
import type { LocalizedName } from "@/types"

interface LocalizedNamesListProps {
  localizedNames: LocalizedName[]
}

export function LocalizedNamesList({ localizedNames }: LocalizedNamesListProps) {
  if (localizedNames.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No localized names available</p>
    )
  }

  return (
    <div className="space-y-2">
      {localizedNames.map((item) => (
        <div key={item.languageCode} className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">
            {item.languageCode}
          </Badge>
          <span className="text-sm">{item.name}</span>
        </div>
      ))}
    </div>
  )
}
