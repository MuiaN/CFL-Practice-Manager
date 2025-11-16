import {
  type User,
  type InsertUser,
  type Case,
  type InsertCase,
  type Document,
  type InsertDocument,
  type CaseAssignment,
  type InsertCaseAssignment,
  users,
  cases,
  documents,
  caseAssignments,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, ilike, or } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  createCase(caseData: InsertCase): Promise<Case>;
  getCaseById(id: string): Promise<Case | undefined>;
  getAllCases(): Promise<Case[]>;
  getCasesByUserId(userId: string): Promise<Case[]>;
  updateCase(id: string, updates: Partial<InsertCase>): Promise<Case | undefined>;
  
  assignUserToCase(assignment: InsertCaseAssignment): Promise<CaseAssignment>;
  getCaseAssignments(caseId: string): Promise<CaseAssignment[]>;
  getUsersForCase(caseId: string): Promise<User[]>;
  
  createDocument(document: InsertDocument): Promise<Document>;
  getDocumentById(id: string): Promise<Document | undefined>;
  getDocumentsByCase(caseId: string): Promise<Document[]>;
  getAllDocuments(): Promise<Document[]>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const updateData = { ...updates };
    if (updates.password) {
      updateData.password = await bcrypt.hash(updates.password, 10);
    }
    
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createCase(caseData: InsertCase): Promise<Case> {
    const [newCase] = await db.insert(cases).values(caseData).returning();
    return newCase;
  }

  async getCaseById(id: string): Promise<Case | undefined> {
    const [caseItem] = await db.select().from(cases).where(eq(cases.id, id));
    return caseItem;
  }

  async getAllCases(): Promise<Case[]> {
    return await db.select().from(cases).orderBy(desc(cases.updatedAt));
  }

  async getCasesByUserId(userId: string): Promise<Case[]> {
    const assignments = await db
      .select({ caseId: caseAssignments.caseId })
      .from(caseAssignments)
      .where(eq(caseAssignments.userId, userId));
    
    const caseIds = assignments.map((a: { caseId: string }) => a.caseId);
    if (caseIds.length === 0) return [];
    
    return await db.select().from(cases).where(
      or(...caseIds.map((id: string) => eq(cases.id, id)))
    );
  }

  async updateCase(id: string, updates: Partial<InsertCase>): Promise<Case | undefined> {
    const [updatedCase] = await db
      .update(cases)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cases.id, id))
      .returning();
    return updatedCase;
  }

  async assignUserToCase(assignment: InsertCaseAssignment): Promise<CaseAssignment> {
    const [newAssignment] = await db
      .insert(caseAssignments)
      .values(assignment)
      .returning();
    return newAssignment;
  }

  async getCaseAssignments(caseId: string): Promise<CaseAssignment[]> {
    return await db
      .select()
      .from(caseAssignments)
      .where(eq(caseAssignments.caseId, caseId));
  }

  async getUsersForCase(caseId: string): Promise<User[]> {
    const assignments = await db
      .select({ userId: caseAssignments.userId })
      .from(caseAssignments)
      .where(eq(caseAssignments.caseId, caseId));
    
    const userIds = assignments.map((a: { userId: string }) => a.userId);
    if (userIds.length === 0) return [];
    
    return await db.select().from(users).where(
      or(...userIds.map((id: string) => eq(users.id, id)))
    );
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async getDocumentById(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async getDocumentsByCase(caseId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.caseId, caseId))
      .orderBy(desc(documents.createdAt));
  }

  async getAllDocuments(): Promise<Document[]> {
    return await db.select().from(documents).orderBy(desc(documents.createdAt));
  }
}

export const storage = new DbStorage();
