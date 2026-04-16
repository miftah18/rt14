import { NextRequest, NextResponse } from 'next/server'
import { createUser, getSessionFromCookie } from '@/lib/auth'
import { findUserByUsername } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Check if user is superadmin (only superadmin can create new users)
    const session = await getSessionFromCookie()

    if (!session || session.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Only superadmin can create new users' },
        { status: 403 }
      )
    }

    const { username, password, name, organizationId, role } = await request.json()

    if (!username || !password || !name || !organizationId || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (!['superadmin', 'admin', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    const existingUser = await findUserByUsername(username)

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      )
    }

    const newUser = await createUser(username, password, name, organizationId, role)

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          organizationId: newUser.organizationId,
          role: newUser.role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
