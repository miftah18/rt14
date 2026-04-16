import { db } from '../lib/drizzle'
import { organizations, users } from '../db/schema'
import { hashPassword } from '../lib/auth'

async function initializeDatabase() {
  console.log('[v0] Initializing database...')

  try {
    // Create root organization (Pusat)
    const [rootOrg] = await db
      .insert(organizations)
      .values({
        name: 'Pusat',
        level: 0,
        parentId: null,
        code: 'PUSAT-001',
      })
      .returning()

    console.log('[v0] Created root organization:', rootOrg)

    // Create a demo superadmin user
    const passwordHash = await hashPassword('password')
    const [superadminUser] = await db
      .insert(users)
      .values({
        username: 'admin',
        passwordHash,
        name: 'Administrator',
        organizationId: rootOrg.id,
        role: 'superadmin',
      })
      .returning()

    console.log('[v0] Created superadmin user:', superadminUser.username)

    // Create sample provinces
    const provinceNames = ['Jawa Tengah', 'Jawa Timur', 'Sumatera Utara']
    const provinces = []

    for (let i = 0; i < provinceNames.length; i++) {
      const [province] = await db
        .insert(organizations)
        .values({
          name: provinceNames[i],
          level: 1,
          parentId: rootOrg.id,
          code: `PROV-${String(i + 1).padStart(3, '0')}`,
        })
        .returning()
      provinces.push(province)
      console.log('[v0] Created province:', province.name)
    }

    // Create sample kabupatens for first province
    if (provinces.length > 0) {
      const kabupatenNames = ['Semarang', 'Demak', 'Rembang']
      for (let i = 0; i < kabupatenNames.length; i++) {
        const [kabupaten] = await db
          .insert(organizations)
          .values({
            name: kabupatenNames[i],
            level: 2,
            parentId: provinces[0].id,
            code: `KAB-${String(i + 1).padStart(3, '0')}`,
          })
          .returning()
        console.log('[v0] Created kabupaten:', kabupaten.name)
      }
    }

    console.log('[v0] Database initialization completed successfully!')
    console.log('[v0] Demo credentials: username=admin, password=password')
  } catch (error) {
    console.error('[v0] Database initialization failed:', error)
    process.exit(1)
  }
}

initializeDatabase()
