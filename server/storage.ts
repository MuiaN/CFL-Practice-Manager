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
  type UserPracticeArea,
  type InsertUserPracticeArea,
  type Folder,
  type InsertFolder,
  users,
  cases,
  documents,
  caseAssignments,
  roles,
  practiceAreas,
  userPracticeAreas,
  folders,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, ilike, or } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  
  createRole(role: InsertRole): Promise<Role>;
  getRole(id: string): Promise<Role | undefined>;
  getAllRoles(): Promise<Role[]>;
  updateRole(id: string, updates: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: string): Promise<boolean>;
  
  createPracticeArea(practiceArea: InsertPracticeArea): Promise<PracticeArea>;
  getPracticeArea(id: string): Promise<PracticeArea | undefined>;
  getAllPracticeAreas(): Promise<PracticeArea[]>;
  updatePracticeArea(id: string, updates: Partial<InsertPracticeArea>): Promise<PracticeArea | undefined>;
  deletePracticeArea(id: string): Promise<boolean>;
  
  assignPracticeAreaToUser(userId: string, practiceAreaId: string): Promise<UserPracticeArea>;
  removePracticeAreaFromUser(userId: string, practiceAreaId: string): Promise<boolean>;
  getUserPracticeAreas(userId: string): Promise<PracticeArea[]>;
  
  createCase(caseData: InsertCase): Promise<Case>;
  getCaseById(id: string): Promise<Case | undefined>;
  getAllCases(): Promise<Case[]>;
  getCasesByUserId(userId: string): Promise<Case[]>;
  updateCase(id: string, updates: Partial<InsertCase>): Promise<Case | undefined>;
  deleteCase(id: string): Promise<boolean>;
  
  assignUserToCase(assignment: InsertCaseAssignment): Promise<CaseAssignment>;
  removeUserFromCase(caseId: string, userId: string): Promise<boolean>;
  getCaseAssignments(caseId: string): Promise<CaseAssignment[]>;
  getUsersForCase(caseId: string): Promise<User[]>;
  
  createDocument(document: InsertDocument): Promise<Document>;
  getDocumentById(id: string): Promise<Document | undefined>;
  getDocumentsByCase(caseId: string): Promise<Document[]>;
  getDocumentsByFolder(folderId: string): Promise<Document[]>;
  getDocumentsByUser(userId: string): Promise<Document[]>;
  getAllDocuments(): Promise<Document[]>;
  updateDocument(id: string, updates: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<boolean>;
  
  createFolder(folder: InsertFolder): Promise<Folder>;
  getFolderById(id: string): Promise<Folder | undefined>;
  getFoldersByUser(userId: string): Promise<Folder[]>;
  getAllFolders(): Promise<Folder[]>;
  updateFolder(id: string, updates: Partial<InsertFolder>): Promise<Folder | undefined>;
  deleteFolder(id: string): Promise<boolean>;
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

  async removeUserFromCase(caseId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(caseAssignments)
      .where(
        and(
          eq(caseAssignments.caseId, caseId),
          eq(caseAssignments.userId, userId)
        )
      );
    return true;
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
    const result = await db.delete(documents).where(eq(documents.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async createRole(roleData: InsertRole): Promise<Role> {
    const [role] = await db.insert(roles).values(roleData).returning();
    return role;
  }

  async getRole(id: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role;
  }

  async getAllRoles(): Promise<Role[]> {
    return await db.select().from(roles).orderBy(roles.name);
  }

  async updateRole(id: string, updates: Partial<InsertRole>): Promise<Role | undefined> {
    const [role] = await db
      .update(roles)
      .set(updates)
      .where(eq(roles.id, id))
      .returning();
    return role;
  }

  async deleteRole(id: string): Promise<boolean> {
    const usersWithRole = await db.select().from(users).where(eq(users.roleId, id));
    if (usersWithRole.length > 0) {
      throw new Error("Cannot delete role that is assigned to users. Please reassign users first.");
    }
    const result = await db.delete(roles).where(eq(roles.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async createPracticeArea(practiceAreaData: InsertPracticeArea): Promise<PracticeArea> {
    const [practiceArea] = await db.insert(practiceAreas).values(practiceAreaData).returning();
    return practiceArea;
  }

  async getPracticeArea(id: string): Promise<PracticeArea | undefined> {
    const [practiceArea] = await db.select().from(practiceAreas).where(eq(practiceAreas.id, id));
    return practiceArea;
  }

  async getAllPracticeAreas(): Promise<PracticeArea[]> {
    return await db.select().from(practiceAreas).orderBy(practiceAreas.name);
  }

  async updatePracticeArea(id: string, updates: Partial<InsertPracticeArea>): Promise<PracticeArea | undefined> {
    const [practiceArea] = await db
      .update(practiceAreas)
      .set(updates)
      .where(eq(practiceAreas.id, id))
      .returning();
    return practiceArea;
  }

  async deletePracticeArea(id: string): Promise<boolean> {
    const casesWithPA = await db.select().from(cases).where(eq(cases.practiceAreaId, id));
    if (casesWithPA.length > 0) {
      throw new Error("Cannot delete practice area that is assigned to cases. Please reassign cases first.");
    }
    const userPAs = await db.select().from(userPracticeAreas).where(eq(userPracticeAreas.practiceAreaId, id));
    if (userPAs.length > 0) {
      throw new Error("Cannot delete practice area that is assigned to users. Please remove user assignments first.");
    }
    const result = await db.delete(practiceAreas).where(eq(practiceAreas.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async assignPracticeAreaToUser(userId: string, practiceAreaId: string): Promise<UserPracticeArea> {
    const [assignment] = await db
      .insert(userPracticeAreas)
      .values({ userId, practiceAreaId })
      .returning();
    return assignment;
  }

  async removePracticeAreaFromUser(userId: string, practiceAreaId: string): Promise<boolean> {
    const result = await db
      .delete(userPracticeAreas)
      .where(
        and(
          eq(userPracticeAreas.userId, userId),
          eq(userPracticeAreas.practiceAreaId, practiceAreaId)
        )
      );
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getUserPracticeAreas(userId: string): Promise<PracticeArea[]> {
    const assignments = await db
      .select({ practiceAreaId: userPracticeAreas.practiceAreaId })
      .from(userPracticeAreas)
      .where(eq(userPracticeAreas.userId, userId));
    
    const paIds = assignments.map((a) => a.practiceAreaId);
    if (paIds.length === 0) return [];
    
    return await db.select().from(practiceAreas).where(
      or(...paIds.map((id) => eq(practiceAreas.id, id)))
    );
  }

  async createFolder(folderData: InsertFolder): Promise<Folder> {
    const [folder] = await db.insert(folders).values(folderData).returning();
    return folder;
  }

  async getFolderById(id: string): Promise<Folder | undefined> {
    const [folder] = await db.select().from(folders).where(eq(folders.id, id));
    return folder;
  }

  async getFoldersByUser(userId: string): Promise<Folder[]> {
    return await db
      .select()
      .from(folders)
      .where(eq(folders.createdById, userId))
      .orderBy(desc(folders.updatedAt));
  }

  async getAllFolders(): Promise<Folder[]> {
    return await db.select().from(folders).orderBy(desc(folders.updatedAt));
  }

  async updateFolder(id: string, updates: Partial<InsertFolder>): Promise<Folder | undefined> {
    const [folder] = await db
      .update(folders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(folders.id, id))
      .returning();
    return folder;
  }

  async deleteFolder(id: string): Promise<boolean> {
    const folderDocuments = await db.select().from(documents).where(eq(documents.folderId, id));
    if (folderDocuments.length > 0) {
      throw new Error("Cannot delete folder with existing documents. Please delete or move documents first.");
    }
    const result = await db.delete(folders).where(eq(folders.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getDocumentsByFolder(folderId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.folderId, folderId))
      .orderBy(desc(documents.createdAt));
  }

  async getDocumentsByUser(userId: string): Promise<Document[]> {
    const userCases = await db
      .select({ caseId: caseAssignments.caseId })
      .from(caseAssignments)
      .where(eq(caseAssignments.userId, userId));
    
    const caseIds = userCases.map((a) => a.caseId);
    
    const userFolders = await db
      .select({ folderId: folders.id })
      .from(folders)
      .where(eq(folders.createdById, userId));
    
    const folderIds = userFolders.map((f) => f.folderId);
    
    const conditions = [];
    if (caseIds.length > 0) {
      conditions.push(...caseIds.map((id) => eq(documents.caseId, id)));
    }
    if (folderIds.length > 0) {
      conditions.push(...folderIds.map((id) => eq(documents.folderId, id)));
    }
    
    if (conditions.length === 0) return [];
    
    return await db
      .select()
      .from(documents)
      .where(or(...conditions))
      .orderBy(desc(documents.createdAt));
  }

  async updateDocument(id: string, updates: Partial<InsertDocument>): Promise<Document | undefined> {
    const [document] = await db
      .update(documents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return document;
  }
}

export const storage = new DbStorage();
