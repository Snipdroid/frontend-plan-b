export interface UserProfile {
  name: string
  email?: string
  picture?: string
}

export interface DesignerDTO {
  id?: string
  oidcIssuer: string
  oidcSubject: string
  name?: string
  email?: string
  createdAt?: string
  updatedAt?: string
}

export function extractUserProfile(idTokenClaims: Record<string, unknown>): UserProfile {
  // Priority: display_name > preferred_username > name
  const name =
    (idTokenClaims.display_name as string) ||
    (idTokenClaims.preferred_username as string) ||
    (idTokenClaims.name as string) ||
    "User"

  const email = idTokenClaims.email as string | undefined

  // Try picture or photo for avatar
  const picture =
    (idTokenClaims.picture as string) || (idTokenClaims.photo as string) || undefined

  return { name, email, picture }
}
