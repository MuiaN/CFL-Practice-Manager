import {
  type User,
  type InsertUser,
  type Case,
  type InsertCase,
  type Document,
  type InsertDocument,
  type CaseAssignment,
  type InsertCaseAssignment,
  type Role,
  type InsertRole,
  type PracticeArea,
  type InsertPracticeArea,
  type ActivityLog,
  users,
  cases,
  documents,
  caseAssignments,
  roles,
  practiceAreas,
  activityLogs,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, ilike, or, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  
  createCase(caseData: InsertCase): Promise<Case>;
  getCaseById(id: string): Promise<Case | undefined>;
  getAllCases(): Promise<Case[]>;
  getCasesByUserId(userId: string): Promise<Case[]>;
  updateCase(id: string, updates: Partial<InsertCase>): Promise<Case | undefined>;
  deleteCase(id: string): Promise<boolean>;
  
  assignUserToCase(assignment: InsertCaseAssignment): Promise<CaseAssignment>;
  getCaseAssignments(caseId: string): Promise<CaseAssignment[]>;
  getUsersForCase(caseId: string): Promise<User[]>;
  
  createDocument(document: InsertDocument): Promise<Document>;
  getDocumentById(id: string): Promise<Document | undefined>;
  getDocumentsByCase(caseId: string): Promise<Document[]>;
  getDocumentVersions(rootDocumentId: string): Promise<Document[]>;
  findRootDocumentByName(caseId: string, name: string): Promise<Document | undefined>;
  updateDocument(id: string, updates: Partial<InsertDocument>): Promise<Document | undefined>;
  getAllDocuments(): Promise<Document[]>;
  deleteDocument(id: string): Promise<boolean>;
  deleteDocumentVersion(versionId: string): Promise<{ deleted: boolean }>;

  createActivityLog(log: { caseId: string; userId?: string | null; action: string; details: object }): Promise<ActivityLog>;
  getActivityLogsByCase(caseId: string): Promise<ActivityLog[]>;

  createRole(role: InsertRole): Promise<Role>;
  getRoles(): Promise<Role[]>;
  deleteRole(id: string): Promise<boolean>;

  createPracticeArea(pa: InsertPracticeArea): Promise<PracticeArea>;
  getPracticeAreas(): Promise<PracticeArea[]>;
  deletePracticeArea(id: string): Promise<boolean>;
  updateRole(id: string, updates: Partial<InsertRole>): Promise<Role | undefined>;
  updatePracticeArea(id: string, updates: Partial<InsertPracticeArea>): Promise<PracticeArea | undefined>;
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

  async deactivateUser(id: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ isActive: "false" })
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
    
    // Also include cases created by the user
    const createdCases = await db.select({ id: cases.id }).from(cases).where(eq(cases.createdById, userId));
    const createdIds = createdCases.map(c => c.id);
    
    const allIds = Array.from(new Set([...caseIds, ...createdIds]));
    
    if (allIds.length === 0) return [];
    
    return await db.select().from(cases).where(
      or(...allIds.map((id: string) => eq(cases.id, id)))
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

  async getDocumentVersions(rootDocumentId: string): Promise<Document[]> {
    const root = await db.select().from(documents).where(eq(documents.id, rootDocumentId));
    const versions = await db
      .select()
      .from(documents)
      .where(eq(documents.parentDocumentId, rootDocumentId))
      .orderBy(desc(documents.createdAt));
    return [...root, ...versions].sort((a, b) => Number(a.version) - Number(b.version));
  }

  async findRootDocumentByName(caseId: string, name: string): Promise<Document | undefined> {
    const [doc] = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.caseId, caseId),
          eq(documents.name, name),
          or(
            eq(documents.parentDocumentId, ""),
            sql`${documents.parentDocumentId} IS NULL`
          )
        )
      )
      .orderBy(desc(documents.createdAt))
      .limit(1);
    return doc;
  }

  async updateDocument(id: string, updates: Partial<InsertDocument>): Promise<Document | undefined> {
    const [doc] = await db
      .update(documents)
      .set(updates)
      .where(eq(documents.id, id))
      .returning();
    return doc;
  }

  async getAllDocuments(): Promise<Document[]> {
    return await db.select().from(documents).orderBy(desc(documents.createdAt));
  }

  async deleteUser(id: string): Promise<boolean> {
    const userCases = await db.select().from(cases).where(eq(cases.createdById, id));
    if (userCases.length > 0) {
      throw new Error("Cannot delete user with existing cases. Please reassign or delete cases first.");
    }
    
    const userAssignments = await db.select().from(caseAssignments).where(eq(caseAssignments.userId, id));
    if (userAssignments.length > 0) {
      throw new Error("Cannot delete user with case assignments. Please remove case assignments first.");
    }
    
    const userDocuments = await db.select().from(documents).where(eq(documents.uploadedById, id));
    if (userDocuments.length > 0) {
      throw new Error("Cannot delete user who has uploaded documents. Please reassign or delete documents first.");
    }
    
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async deleteCase(id: string): Promise<boolean> {
    const caseDocuments = await db.select().from(documents).where(eq(documents.caseId, id));
    if (caseDocuments.length > 0) {
      throw new Error("Cannot delete case with existing documents. Please delete documents first.");
    }
    
    const caseAssignmentsList = await db.select().from(caseAssignments).where(eq(caseAssignments.caseId, id));
    if (caseAssignmentsList.length > 0) {
      throw new Error("Cannot delete case with existing assignments. Please remove assignments first.");
    }
    
    const result = await db.delete(cases).where(eq(cases.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async deleteDocument(id: string): Promise<boolean> {
    // Delete all child versions that reference this doc as their parent
    await db.delete(documents).where(eq(documents.parentDocumentId, id));
    // Also handle case where we're deleting a version (not root): delete its children too
    const result = await db.delete(documents).where(eq(documents.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async deleteDocumentVersion(versionId: string): Promise<{ deleted: boolean }> {
    // Load the version to delete
    const [versionDoc] = await db.select().from(documents).where(eq(documents.id, versionId)).limit(1);
    if (!versionDoc) return { deleted: false };

    const rootId = versionDoc.parentDocumentId || versionDoc.id;
    const isRoot = !versionDoc.parentDocumentId;

    // Load all versions sorted ascending
    const allVersions = (await this.getDocumentVersions(rootId))
      .sort((a, b) => Number(a.version) - Number(b.version));

    if (allVersions.length === 1) {
      // Only version — delete everything
      await db.delete(documents).where(eq(documents.id, versionId));
      return { deleted: true };
    }

    // Delete the target version
    await db.delete(documents).where(eq(documents.id, versionId));

    // Remaining versions in order
    const remaining = allVersions
      .filter(v => v.id !== versionId)
      .sort((a, b) => Number(a.version) - Number(b.version));

    if (isRoot) {
      // Promote the new first doc to root (clear parentDocumentId)
      const newRoot = remaining[0];
      await db.update(documents)
        .set({ parentDocumentId: null, version: "1" })
        .where(eq(documents.id, newRoot.id));

      // Update the rest to point to the new root and renumber
      for (let i = 1; i < remaining.length; i++) {
        await db.update(documents)
          .set({ parentDocumentId: newRoot.id, version: (i + 1).toString() })
          .where(eq(documents.id, remaining[i].id));
      }
    } else {
      // Root stays — just renumber all remaining sequentially
      for (let i = 0; i < remaining.length; i++) {
        await db.update(documents)
          .set({ version: (i + 1).toString() })
          .where(eq(documents.id, remaining[i].id));
      }
    }

    return { deleted: true };
  }

  async createActivityLog(log: { caseId: string; userId?: string | null; action: string; details: object }): Promise<ActivityLog> {
    const [entry] = await db.insert(activityLogs).values({
      caseId: log.caseId,
      userId: log.userId ?? null,
      action: log.action,
      details: JSON.stringify(log.details),
    }).returning();
    return entry;
  }

  async getActivityLogsByCase(caseId: string): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.caseId, caseId))
      .orderBy(desc(activityLogs.createdAt));
  }

  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db.insert(roles).values(role).returning();
    return newRole;
  }

  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles).orderBy(desc(roles.createdAt));
  }

  async deleteRole(id: string): Promise<boolean> {
    const result = await db.delete(roles).where(eq(roles.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async createPracticeArea(pa: InsertPracticeArea): Promise<PracticeArea> {
    const [newPA] = await db.insert(practiceAreas).values(pa).returning();
    return newPA;
  }

  async getPracticeAreas(): Promise<PracticeArea[]> {
    return await db.select().from(practiceAreas).orderBy(desc(practiceAreas.createdAt));
  }

  async deletePracticeArea(id: string): Promise<boolean> {
    const result = await db.delete(practiceAreas).where(eq(practiceAreas.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async updateRole(id: string, updates: Partial<InsertRole>): Promise<Role | undefined> {
    const [role] = await db.update(roles).set(updates).where(eq(roles.id, id)).returning();
    return role;
  }

  async updatePracticeArea(id: string, updates: Partial<InsertPracticeArea>): Promise<PracticeArea | undefined> {
    const [pa] = await db.update(practiceAreas).set(updates).where(eq(practiceAreas.id, id)).returning();
    return pa;
  }
}

export const storage = new DbStorage();
