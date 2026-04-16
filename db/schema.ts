import { relations } from 'drizzle-orm';
import { pgTable, serial, text, integer, timestamp, varchar, uniqueIndex } from 'drizzle-orm/pg-core'

// Organizations table - hierarchical structure for Pusat -> Provinsi -> Kabupaten -> Kecamatan -> Ranting
export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  level: integer('level').notNull(), // 0=Pusat, 1=Provinsi, 2=Kabupaten, 3=Kecamatan, 4=Ranting
  parentId: integer('parent_id').references(() => organizations.id, { onDelete: 'set null' }),
  code: varchar('code', { length: 50 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  parentIdIdx: uniqueIndex('idx_organizations_parent_id').on(table.parentId),
}))

// Members table - organization members/warga
export const members = pgTable('members', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  nik: varchar('nik', { length: 16 }).notNull().unique(), // Indonesian ID number
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  organizationId: integer('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  nikIdx: uniqueIndex('idx_members_nik').on(table.nik),
  orgIdx: uniqueIndex('idx_members_organization_id').on(table.organizationId),
}))

// BPH (Administrative/Management positions) table
export const bph = pgTable('bph', {
  id: serial('id').primaryKey(),
  memberId: integer('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  organizationId: integer('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  position: text('position').notNull(), // e.g., Ketua, Sekretaris, Bendahara
  period: varchar('period', { length: 20 }), // e.g., "2024-2025"
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  memberIdx: uniqueIndex('idx_bph_member_id').on(table.memberId),
  orgIdx: uniqueIndex('idx_bph_organization_id').on(table.organizationId),
}))

// Users table - system users with authentication
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  organizationId: integer('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull(), // 'superadmin', 'admin', 'viewer'
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  usernameIdx: uniqueIndex('idx_users_username').on(table.username),
  orgIdx: uniqueIndex('idx_users_organization_id').on(table.organizationId),
}))

// Logs table - audit trail
export const logs = pgTable('logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(), // 'create', 'update', 'delete', etc.
  tableName: varchar('table_name', { length: 100 }),
  recordId: integer('record_id'),
  details: text('details'), // JSON details of the action
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: uniqueIndex('idx_logs_user_id').on(table.userId),
}))

// Relations
export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  parent: one(organizations, {
    fields: [organizations.parentId],
    references: [organizations.id],
    relationName: 'parent',
  }),
  children: many(organizations, { relationName: 'parent' }),
  members: many(members),
  bph: many(bph),
  users: many(users),
}))

export const membersRelations = relations(members, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [members.organizationId],
    references: [organizations.id],
  }),
  bphPositions: many(bph),
}))

export const bphRelations = relations(bph, ({ one }) => ({
  member: one(members, {
    fields: [bph.memberId],
    references: [members.id],
  }),
  organization: one(organizations, {
    fields: [bph.organizationId],
    references: [organizations.id],
  }),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  logs: many(logs),
}))

export const logsRelations = relations(logs, ({ one }) => ({
  user: one(users, {
    fields: [logs.userId],
    references: [users.id],
  }),
}))
