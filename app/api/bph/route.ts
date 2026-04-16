import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/drizzle'
import { bph } from '@/db/schema'
import { desc, inArray } from 'drizzle-orm'
import { getSessionFromCookie, getOrganizationWithDescendants } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's accessible organization IDs
    const accessibleOrgIds = await getOrganizationWithDescendants(session.organizationId)

    const allBph = await db.query.bph.findMany({
      with: { member: true, organization: true },
      orderBy: desc(bph.createdAt),
    })

    // Filter to accessible BPH entries
    const filteredBph = session.role === 'superadmin'
      ? allBph
      : allBph.filter(b => accessibleOrgIds.includes(b.organizationId))

    return NextResponse.json(filteredBph)
  } catch (error) {
    console.error('GET /api/bph error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie()
    if (!session || session.role === 'viewer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { memberId, organizationId, position, period } = await request.json()

    if (!memberId || !organizationId || !position) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify organizationId is accessible
    const accessibleOrgIds = await getOrganizationWithDescendants(session.organizationId)
    if (session.role !== 'superadmin' && !accessibleOrgIds.includes(organizationId)) {
      return NextResponse.json({ error: 'Organization not accessible' }, { status: 403 })
    }

    const [newBph] = await db
      .insert(bph)
      .values({
        memberId,
        organizationId,
        position,
        period: period || null,
      })
      .returning()

    return NextResponse.json(newBph, { status: 201 })
  } catch (error) {
    console.error('POST /api/bph error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
