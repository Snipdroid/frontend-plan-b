import { useEffect, useRef } from "react"
import useSWR from "swr"
import { API_BASE_URL } from "@/services/api"
import { swrKeys } from "@/lib/swr-keys"

/**
 * Fetcher function that returns object URL directly
 * @param endpoint - API endpoint (e.g., "/app-icon?packageName=...")
 * @returns Promise resolving to object URL string
 */
async function iconUrlFetcher(endpoint: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`)

  if (!response.ok) {
    const error = new Error(`Icon fetch failed: ${response.status}`)
    ;(error as Error & { status: number }).status = response.status
    throw error
  }

  const blob = await response.blob()

  // Validate blob is an image
  if (!blob.type.startsWith("image/")) {
    throw new Error("Invalid image format")
  }

  return URL.createObjectURL(blob)
}

/**
 * SWR hook for fetching app icon as object URL
 * Automatically manages object URL cleanup
 * @param packageName - Package name of the app (null/undefined to skip fetching)
 * @returns Object with objectUrl (or null), error, and loading state
 */
export function useAppIconUrl(packageName: string | null | undefined) {
  const { data: objectUrl, error, isLoading } = useSWR<string>(
    packageName ? swrKeys.appIcon(packageName) : null,
    iconUrlFetcher,
    {
      revalidateOnFocus: false, // Icons rarely change
      dedupingInterval: 60000, // 1 minute deduping
      shouldRetryOnError: (error) => {
        const status = (error as Error & { status?: number })?.status
        // Only retry on server errors, not client errors (404, 403, etc.)
        return status === 500 || status === 503
      },
      errorRetryCount: 2,
      errorRetryInterval: 2000,
    }
  )

  // Track current URL for cleanup on unmount
  const urlRef = useRef<string | null>(null)

  // Cleanup on unmount or when URL changes
  useEffect(() => {
    // Store current URL
    urlRef.current = objectUrl || null

    // Cleanup function
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
      }
    }
  }, [objectUrl])

  return { objectUrl: objectUrl || null, error, isLoading }
}
