import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/drizzle'
import { members } from '@/db/schema'
import { eq, desc, inArray } from 'drizzle-orm'
import { getSessionFromCookie, getOrganizationWithDescendants } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's accessible organization IDs
    const accessibleOrgIds = await getOrganizationWithDescendants(session.organizationId)

    const allMembers = await db.query.members.findMany({
      with: { organization: true },
      orderBy: desc(members.createdAt),
    })

    // Filter to accessible members based on user role
    const filteredMembers = session.role === 'superadmin'
      ? allMembers
      : allMembers.filter(m => accessibleOrgIds.includes(m.organizationId))

    return NextResponse.json(filteredMembers)
  } catch (error) {
    console.error('GET /api/members error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie()
    if (!session || session.role === 'viewer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, nik, phone, address, organizationId } = await request.json()

    if (!name || !nik || !organizationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify organizationId is accessible
    const accessibleOrgIds = await getOrganizationWithDescendants(session.organizationId)
    if (session.role !== 'superadmin' && !accessibleOrgIds.includes(organizationId)) {
      return NextResponse.json({ error: 'Organization not accessible' }, { status: 403 })
    }

    // Check for duplicate NIK
    const existingMember = await db.query.members.findFirst({
      where: eq(members.nik, nik),
    })

    if (existingMember) {
      return NextResponse.json({ error: 'NIK already exists' }, { status: 409 })
    }

    const [newMember] = await db
      .insert(members)
      .values({
        name,
        nik,
        phone: phone || null,
        address: address || null,
        organizationId,
      })
      .returning()

    return NextResponse.json(newMember, { status: 201 })
  } catch (error) {
    console.error('POST /api/members error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
