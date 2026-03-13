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

export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  permissions: text("permissions").array().default(sql`ARRAY[]::text[]`), // e.g. ["cases", "documents", "admin"]
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const practiceAreas = pgTable("practice_areas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  dashboardConfig: text("dashboard_config"), // JSON string or comma-separated list of widgets
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("associate"),
  customRoleId: varchar("custom_role_id").references(() => roles.id),
  practiceAreas: practiceAreaEnum("practice_areas").array(),
  customPracticeAreaIds: varchar("custom_practice_area_ids").array(),
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cases = pgTable("cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseNumber: text("case_number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  practiceArea: practiceAreaEnum("practice_area").notNull(),
  customPracticeAreaId: varchar("custom_practice_area_id").references(() => practiceAreas.id),
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
  parentDocumentId: varchar("parent_document_id"),
  changeNote: text("change_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
});

export const insertPracticeAreaSchema = createInsertSchema(practiceAreas).omit({
  id: true,
  createdAt: true,
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

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type PracticeArea = typeof practiceAreas.$inferSelect;
export type InsertPracticeArea = z.infer<typeof insertPracticeAreaSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Case = typeof cases.$inferSelect;
export type InsertCase = z.infer<typeof insertCaseSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type CaseAssignment = typeof caseAssignments.$inferSelect;
export type InsertCaseAssignment = z.infer<typeof insertCaseAssignmentSchema>;
