import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/drizzle'
import { organizations } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { getSessionFromCookie, getOrganizationWithDescendants } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's accessible organization IDs (self + descendants)
    const accessibleOrgIds = await getOrganizationWithDescendants(session.organizationId)

    const allOrgs = await db.query.organizations.findMany({
      orderBy: desc(organizations.createdAt),
    })

    // Filter to accessible orgs based on user role
    const filteredOrgs = session.role === 'superadmin' 
      ? allOrgs 
      : allOrgs.filter(org => accessibleOrgIds.includes(org.id))

    return NextResponse.json(filteredOrgs)
  } catch (error) {
    console.error('GET /api/organizations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie()
    if (!session || session.role === 'viewer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, level, parentId, code } = await request.json()

    if (!name || level === undefined || !code) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify parentId is accessible if provided
    if (parentId) {
      const accessibleOrgIds = await getOrganizationWithDescendants(session.organizationId)
      if (session.role !== 'superadmin' && !accessibleOrgIds.includes(parentId)) {
        return NextResponse.json({ error: 'Parent organization not accessible' }, { status: 403 })
      }
    }

    const [newOrg] = await db
      .insert(organizations)
      .values({
        name,
        level,
        parentId: parentId || null,
        code,
      })
      .returning()

    return NextResponse.json(newOrg, { status: 201 })
  } catch (error) {
    console.error('POST /api/organizations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
