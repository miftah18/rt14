import { NextRequest, NextResponse } from 'next/server'
import { findUserByUsername, verifyPassword, SessionUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const user = await findUserByUsername(username)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    const passwordMatch = await verifyPassword(password, user.passwordHash)

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    const sessionUser: SessionUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      organizationId: user.organizationId,
      role: user.role as 'superadmin' | 'admin' | 'viewer',
    }

    // Set session cookie and create response
    const response = NextResponse.json(
      { success: true, user: sessionUser },
      { status: 200 }
    )

    // Set session cookie
    const cookieValue = Buffer.from(JSON.stringify(sessionUser)).toString('base64')
    response.cookies.set('session', cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
