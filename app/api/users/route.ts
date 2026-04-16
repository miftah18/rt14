import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/drizzle'
import { users } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { getSessionFromCookie, getOrganizationWithDescendants } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only superadmin and admin can view users
    if (session.role === 'viewer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get user's accessible organization IDs
    const accessibleOrgIds = await getOrganizationWithDescendants(session.organizationId)

    const allUsers = await db.query.users.findMany({
      with: { organization: true },
      orderBy: desc(users.createdAt),
    })

    // Filter to accessible users
    const filteredUsers = session.role === 'superadmin'
      ? allUsers
      : allUsers.filter(u => accessibleOrgIds.includes(u.organizationId))

    // Remove password hashes from response
    return NextResponse.json(
      filteredUsers.map(u => ({
        id: u.id,
        username: u.username,
        name: u.name,
        organizationId: u.organizationId,
        role: u.role,
        createdAt: u.createdAt,
      }))
    )
  } catch (error) {
    console.error('GET /api/users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie()
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Only superadmin can create users' }, { status: 403 })
    }

    const { username, password, name, organizationId, role } = await request.json()

    if (!username || !password || !name || !organizationId || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['superadmin', 'admin', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Call register endpoint to create user
    const response = await fetch(new URL('/api/auth/register', request.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, name, organizationId, role }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('POST /api/users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
