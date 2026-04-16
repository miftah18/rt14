import bcrypt from 'bcryptjs'
import { db } from './drizzle'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'

export const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production'

export type UserRole = 'superadmin' | 'admin' | 'viewer'

export interface SessionUser {
  id: number
  username: string
  name: string
  organizationId: number
  role: UserRole
}

// Hash password with bcrypt
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return bcrypt.hash(password, saltRounds)
}

// Verify password against hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Find user by username
export async function findUserByUsername(username: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  })
  return user
}

// Create a new user
export async function createUser(
  username: string,
  password: string,
  name: string,
  organizationId: number,
  role: UserRole
) {
  const passwordHash = await hashPassword(password)
  const newUser = await db.insert(users).values({
    username,
    passwordHash,
    name,
    organizationId,
    role,
  }).returning()
  return newUser[0]
}

// Get organization and its descendants
export async function getOrganizationWithDescendants(orgId: number): Promise<number[]> {
  const result: number[] = [orgId]
  
  async function getChildren(parentId: number) {
    const { organizations } = await import('@/db/schema')
    const children = await db.query.organizations.findMany({
      where: eq(organizations.parentId, parentId),
    })
    for (const child of children) {
      result.push(child.id)
      await getChildren(child.id)
    }
  }
  
  await getChildren(orgId)
  return result
}

// Parse session cookie
export async function getSessionFromCookie(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')
  
  if (!sessionCookie?.value) {
    return null
  }
  
  try {
    // Simple base64 encoding for session (in production, use JWT or proper session management)
    const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
    const session = JSON.parse(decoded) as SessionUser
    return session
  } catch {
    return null
  }
}

// Set session cookie
export async function setSessionCookie(user: SessionUser): Promise<void> {
  const cookieStore = await cookies()
  const sessionData = JSON.stringify(user)
  const encoded = Buffer.from(sessionData).toString('base64')
  
  cookieStore.set('session', encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

// Clear session cookie
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}
