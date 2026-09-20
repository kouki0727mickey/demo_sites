import {sqliteTable,text} from 'drizzle-orm/sqlite-core';
export const sites=sqliteTable('sites',{id:text('id').primaryKey(),name:text('name').notNull(),url:text('url').notNull(),category:text('category').notNull(),description:text('description').notNull(),tags:text('tags').notNull(),status:text('status').notNull(),createdAt:text('created_at').notNull()});
