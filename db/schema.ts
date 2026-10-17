import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const records=sqliteTable('records',{
 id:text('id').primaryKey(),kind:text('kind').notNull(),data:text('data').notNull(),
 revision:integer('revision').notNull(),sortOrder:integer('sort_order').notNull().default(0),deleted:integer('deleted').notNull().default(0),
});
export const editors=sqliteTable('editors',{email:text('email').primaryKey()});
