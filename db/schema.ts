import { pgTable, serial, text, integer, timestamp, boolean, relations } from 'drizzle-orm/pg-core'

export const Warga = pgTable('warga', {
  id:        serial('id').primaryKey(),
  nama:      text('nama').notNull(),
  no_hp:     text('no_hp').notNull().unique(),
  barcodeId: text('barcode_id').notNull().unique(),
})

export const Transaksi = pgTable('transaksi', {
  id:       serial('id').primaryKey(),
  wargaId:  integer('warga_id').notNull().references(() => Warga.id, { onDelete: 'cascade' }),
  tanggal:  timestamp('tanggal').notNull(),
  nominal:  integer('nominal').notNull().default(0),
  isLunas:  boolean('is_lunas').notNull().default(false),
})

// Relations (needed for db.query.Transaksi.findMany({ with: { warga: true } }))
export const wargaRelations = relations(Warga, ({ many }) => ({
  transaksi: many(Transaksi),
}))

export const transaksiRelations = relations(Transaksi, ({ one }) => ({
  warga: one(Warga, {
    fields: [Transaksi.wargaId],
    references: [Warga.id],
  }),
}))
