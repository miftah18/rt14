import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/drizzle'
import { logs } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { getSessionFromCookie, getOrganizationWithDescendants } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only superadmin and admin can view logs
    if (session.role === 'viewer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const allLogs = await db.query.logs.findMany({
      with: { user: true },
      orderBy: desc(logs.createdAt),
      limit: 100,
    })

    // Filter logs to those performed by users in accessible organizations
    const accessibleOrgIds = await getOrganizationWithDescendants(session.organizationId)

    const filteredLogs = session.role === 'superadmin'
      ? allLogs
      : allLogs.filter(l => accessibleOrgIds.includes(l.user.organizationId))

    return NextResponse.json(filteredLogs)
  } catch (error) {
    console.error('GET /api/logs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, tableName, recordId, details } = await request.json()

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    const [newLog] = await db
      .insert(logs)
      .values({
        userId: session.id,
        action,
        tableName: tableName || null,
        recordId: recordId || null,
        details: details ? JSON.stringify(details) : null,
      })
      .returning()

    return NextResponse.json(newLog, { status: 201 })
  } catch (error) {
    console.error('POST /api/logs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
