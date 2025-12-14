import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ParsedAppEntry } from "@/types/upload"
import { ImageOff } from "lucide-react"

interface AppPreviewListProps {
  entries: ParsedAppEntry[]
}

export function AppPreviewList({ entries }: AppPreviewListProps) {
  if (entries.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        No app entries parsed yet. Upload ZIP files containing appfilter.xml.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        {entries.length} app{entries.length !== 1 ? "s" : ""} found
      </p>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Icon</TableHead>
              <TableHead>Package Name</TableHead>
              <TableHead>Main Activity</TableHead>
              <TableHead>Drawable</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, index) => (
              <TableRow key={`${entry.packageName}-${entry.mainActivity}-${index}`}>
                <TableCell>
                  {entry.iconUrl ? (
                    <img
                      src={entry.iconUrl}
                      alt={entry.drawableName}
                      className="h-8 w-8 rounded object-contain"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                      <ImageOff className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {entry.packageName}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {entry.mainActivity}
                </TableCell>
                <TableCell className="text-sm">{entry.drawableName}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {entry.sourceFile}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
