import type { SWRConfiguration } from "swr"
import { API_BASE_URL } from "@/services/api"

// Base fetcher for public endpoints (no auth required)
export async function publicFetcher<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const error = new Error(`API Error: ${response.status} ${response.statusText}`)
    ;(error as Error & { status: number }).status = response.status
    throw error
  }

  return response.json()
}

// Fetcher for authenticated endpoints - token passed via key tuple
export async function authFetcher<T>([endpoint, token]: [string, string]): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = new Error(`API Error: ${response.status} ${response.statusText}`)
    ;(error as Error & { status: number }).status = response.status
    throw error
  }

  return response.json()
}

// Default SWR configuration
export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 2000, // Dedupe requests within 2 seconds
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  shouldRetryOnError: (error) => {
    // Don't retry on 4xx errors (client errors)
    const status = (error as Error & { status?: number })?.status
    return !(status && status >= 400 && status < 500)
  },
}
