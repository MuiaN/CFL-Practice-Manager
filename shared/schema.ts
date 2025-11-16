import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["admin", "senior_associate", "associate"]);
export const caseStatusEnum = pgEnum("case_status", ["active", "pending", "closed", "under_review"]);
export const practiceAreaEnum = pgEnum("practice_area", [
  "corporate_commercial",
  "intellectual_property",
  "real_estate",
  "banking_finance",
  "dispute_resolution",
  "tmt"
]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("associate"),
  practiceAreas: practiceAreaEnum("practice_areas").array(),
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cases = pgTable("cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseNumber: text("case_number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  practiceArea: practiceAreaEnum("practice_area").notNull(),
  status: caseStatusEnum("status").notNull().default("pending"),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const caseAssignments = pgTable("case_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  size: text("size").notNull(),
  caseId: varchar("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  uploadedById: varchar("uploaded_by_id").notNull().references(() => users.id),
  version: text("version").notNull().default("1"),
  filePath: text("file_path").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCaseSchema = createInsertSchema(cases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertCaseAssignmentSchema = createInsertSchema(caseAssignments).omit({
  id: true,
  assignedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof cases.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertCaseAssignment = z.infer<typeof insertCaseAssignmentSchema>;
export type CaseAssignment = typeof caseAssignments.$inferSelect;
