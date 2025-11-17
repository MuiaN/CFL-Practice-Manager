import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateToken, verifyPassword, authenticateToken, requireAdmin, type AuthRequest } from "./auth";
import { insertUserSchema, insertCaseSchema, insertDocumentSchema, insertCaseAssignmentSchema, insertRoleSchema, insertPracticeAreaSchema, insertFolderSchema, insertSettingsSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import { z } from "zod";

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 },
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const role = user.roleId ? await storage.getRole(user.roleId) : null;
      const token = generateToken(user.id, role?.name || "");
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        token,
        user: { ...userWithoutPassword, role: role?.name || null },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const role = user.roleId ? await storage.getRole(user.roleId) : null;
      const practiceAreas = await storage.getUserPracticeAreas(user.id);

      const { password: _, ...userWithoutPassword } = user;
      res.json({
        ...userWithoutPassword,
        role: role?.name || null,
        practiceAreas: practiceAreas.map(pa => pa.name),
      });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const usersWithPracticeAreas = await Promise.all(
        allUsers.map(async (user) => {
          const practiceAreas = await storage.getUserPracticeAreas(user.id);
          const role = user.roleId ? await storage.getRole(user.roleId) : null;
          const { password, ...userWithoutPassword } = user;
          return {
            ...userWithoutPassword,
            role: role?.name || null,
            practiceAreaIds: practiceAreas.map(pa => pa.id),
            practiceAreas: practiceAreas.map(pa => pa.name),
          };
        })
      );
      res.json(usersWithPracticeAreas);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { practiceAreaIds, ...userData } = req.body;
      const validatedUserData = insertUserSchema.parse(userData);
      
      // Validate practice area IDs if provided
      if (practiceAreaIds !== undefined) {
        const practiceAreaIdsSchema = z.array(z.string().uuid()).optional();
        const validatedPracticeAreaIds = practiceAreaIdsSchema.parse(practiceAreaIds);
        
        // Verify practice areas exist
        if (validatedPracticeAreaIds && validatedPracticeAreaIds.length > 0) {
          const allPracticeAreas = await storage.getAllPracticeAreas();
          const validIds = new Set(allPracticeAreas.map(pa => pa.id));
          const invalidIds = validatedPracticeAreaIds.filter(id => !validIds.has(id));
          
          if (invalidIds.length > 0) {
            return res.status(400).json({ 
              message: "Invalid practice area IDs",
              invalidIds 
            });
          }
        }
      }
      
      const user = await storage.createUser(validatedUserData);
      
      // Assign practice areas if provided and valid
      if (practiceAreaIds && Array.isArray(practiceAreaIds)) {
        for (const paId of practiceAreaIds) {
          await storage.assignPracticeAreaToUser(user.id, paId);
        }
      }
      
      // Get practice areas to return in response
      const userPracticeAreas = await storage.getUserPracticeAreas(user.id);
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({
        ...userWithoutPassword,
        practiceAreaIds: userPracticeAreas.map(pa => pa.id),
        practiceAreas: userPracticeAreas.map(pa => pa.name),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Create user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/users/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { practiceAreaIds, ...updates } = req.body;
      
      // Validate practice area IDs if provided
      if (practiceAreaIds !== undefined) {
        const practiceAreaIdsSchema = z.array(z.string().uuid());
        const validatedPracticeAreaIds = practiceAreaIdsSchema.parse(practiceAreaIds);
        
        // Verify practice areas exist
        if (validatedPracticeAreaIds.length > 0) {
          const allPracticeAreas = await storage.getAllPracticeAreas();
          const validIds = new Set(allPracticeAreas.map(pa => pa.id));
          const invalidIds = validatedPracticeAreaIds.filter(id => !validIds.has(id));
          
          if (invalidIds.length > 0) {
            return res.status(400).json({ 
              message: "Invalid practice area IDs",
              invalidIds 
            });
          }
        }
      }
      
      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update practice areas if provided and valid
      if (practiceAreaIds !== undefined && Array.isArray(practiceAreaIds)) {
        // Get current practice areas
        const currentPracticeAreas = await storage.getUserPracticeAreas(id);
        const currentIds = currentPracticeAreas.map(pa => pa.id);
        
        // Remove practice areas that are no longer selected
        for (const paId of currentIds) {
          if (!practiceAreaIds.includes(paId)) {
            await storage.removePracticeAreaFromUser(id, paId);
          }
        }
        
        // Add new practice areas
        for (const paId of practiceAreaIds) {
          if (!currentIds.includes(paId)) {
            await storage.assignPracticeAreaToUser(id, paId);
          }
        }
      }

      // Get practice areas to return in response
      const userPracticeAreas = await storage.getUserPracticeAreas(id);
      const { password: _, ...userWithoutPassword } = user;
      res.json({
        ...userWithoutPassword,
        practiceAreaIds: userPracticeAreas.map(pa => pa.id),
        practiceAreas: userPracticeAreas.map(pa => pa.name),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid practice area data", errors: error.errors });
      }
      console.error("Update user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/users/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteUser(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(204).send();
    } catch (error: any) {
      if (error.message?.includes("Cannot delete user")) {
        return res.status(409).json({ message: error.message });
      }
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/cases", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (req.userRole === "admin") {
        const allCases = await storage.getAllCases();
        res.json(allCases);
      } else {
        const userCases = await storage.getCasesByUserId(req.userId!);
        res.json(userCases);
      }
    } catch (error) {
      console.error("Get cases error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/cases", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const caseData = insertCaseSchema.parse({
        ...req.body,
        createdById: req.userId,
      });
      
      // Generate case number automatically
      const year = new Date().getFullYear();
      const allCases = await storage.getAllCases();
      const caseCount = allCases.length + 1;
      const caseNumber = `CFL-${year}-${String(caseCount).padStart(4, '0')}`;
      
      const newCase = await storage.createCase({
        ...caseData,
        caseNumber,
      });
      res.status(201).json(newCase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid case data", errors: error.errors });
      }
      console.error("Create case error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/cases/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const caseItem = await storage.getCaseById(id);
      
      if (!caseItem) {
        return res.status(404).json({ message: "Case not found" });
      }

      if (req.userRole !== "admin" && caseItem.createdById !== req.userId) {
        const assignedUsers = await storage.getUsersForCase(id);
        const isAssigned = assignedUsers.some(user => user.id === req.userId);
        
        if (!isAssigned) {
          return res.status(403).json({ message: "Access denied. You must be assigned to this case." });
        }
      }

      res.json(caseItem);
    } catch (error) {
      console.error("Get case error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/cases/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const existingCase = await storage.getCaseById(id);
      if (!existingCase) {
        return res.status(404).json({ message: "Case not found" });
      }

      if (req.userRole !== "admin" && existingCase.createdById !== req.userId) {
        return res.status(403).json({ message: "You can only update cases you created" });
      }

      const updatedCase = await storage.updateCase(id, updates);
      res.json(updatedCase);
    } catch (error) {
      console.error("Update case error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/cases/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCase(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Case not found" });
      }

      res.status(204).send();
    } catch (error: any) {
      if (error.message?.includes("Cannot delete case")) {
        return res.status(409).json({ message: error.message });
      }
      console.error("Delete case error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/cases/:id/assign", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      const caseItem = await storage.getCaseById(id);
      if (!caseItem) {
        return res.status(404).json({ message: "Case not found" });
      }

      if (req.userRole !== "admin" && caseItem.createdById !== req.userId) {
        return res.status(403).json({ message: "Only admins or case owners can assign users" });
      }

      const assignment = await storage.assignUserToCase({ caseId: id, userId });
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Assign user to case error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/cases/:caseId/users/:userId", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { caseId, userId } = req.params;

      const caseItem = await storage.getCaseById(caseId);
      if (!caseItem) {
        return res.status(404).json({ message: "Case not found" });
      }

      await storage.removeUserFromCase(caseId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Remove user from case error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/cases/:id/users", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      const caseItem = await storage.getCaseById(id);
      if (!caseItem) {
        return res.status(404).json({ message: "Case not found" });
      }

      if (req.userRole !== "admin" && caseItem.createdById !== req.userId) {
        const assignedUsers = await storage.getUsersForCase(id);
        const isAssigned = assignedUsers.some(user => user.id === req.userId);
        
        if (!isAssigned) {
          return res.status(403).json({ message: "Access denied. You must be assigned to this case." });
        }
      }
      
      const assignedUsers = await storage.getUsersForCase(id);
      const usersWithoutPasswords = assignedUsers.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get case users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/documents", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const allDocuments = await storage.getAllDocuments();
      res.json(allDocuments);
    } catch (error) {
      console.error("Get documents error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/documents", authenticateToken, upload.single("file"), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "File required" });
      }

      const { caseId, folderId } = req.body;
      if (!caseId && !folderId) {
        return res.status(400).json({ message: "Either Case ID or Folder ID required" });
      }

      if (caseId && folderId) {
        return res.status(400).json({ message: "Document can belong to either a case or folder, not both" });
      }

      const fileExtension = path.extname(req.file.originalname).substring(1).toUpperCase();
      const documentData = {
        name: req.file.originalname,
        type: fileExtension,
        mimeType: req.file.mimetype,
        size: `${Math.round(req.file.size / 1024)} KB`,
        caseId: caseId || null,
        folderId: folderId || null,
        uploadedById: req.userId!,
        filePath: req.file.path,
        version: "1",
      };

      const document = await storage.createDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      console.error("Upload document error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/documents/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocumentById(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      if (document.caseId) {
        const caseItem = await storage.getCaseById(document.caseId);
        if (!caseItem) {
          return res.status(404).json({ message: "Associated case not found" });
        }

        if (req.userRole !== "admin" && caseItem.createdById !== req.userId) {
          const assignedUsers = await storage.getUsersForCase(document.caseId);
          const isAssigned = assignedUsers.some(user => user.id === req.userId);
          
          if (!isAssigned) {
            return res.status(403).json({ message: "Access denied. You must be assigned to this case." });
          }
        }
      } else if (document.folderId) {
        const folder = await storage.getFolderById(document.folderId);
        if (!folder) {
          return res.status(404).json({ message: "Associated folder not found" });
        }

        if (req.userRole !== "admin" && folder.createdById !== req.userId) {
          return res.status(403).json({ message: "Access denied to this folder." });
        }
      }

      res.json(document);
    } catch (error) {
      console.error("Get document error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/cases/:id/documents", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      const caseItem = await storage.getCaseById(id);
      if (!caseItem) {
        return res.status(404).json({ message: "Case not found" });
      }

      if (req.userRole !== "admin" && caseItem.createdById !== req.userId) {
        const assignedUsers = await storage.getUsersForCase(id);
        const isAssigned = assignedUsers.some(user => user.id === req.userId);
        
        if (!isAssigned) {
          return res.status(403).json({ message: "Access denied. You must be assigned to this case." });
        }
      }
      
      const caseDocuments = await storage.getDocumentsByCase(id);
      res.json(caseDocuments);
    } catch (error) {
      console.error("Get case documents error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/documents/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteDocument(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Document not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Delete document error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/documents/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updates = insertDocumentSchema.partial().parse(req.body);
      
      const document = await storage.updateDocument(id, updates);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid document data", errors: error.errors });
      }
      console.error("Update document error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/documents/:id/download", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocumentById(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      if (document.caseId) {
        const caseItem = await storage.getCaseById(document.caseId);
        if (!caseItem) {
          return res.status(404).json({ message: "Associated case not found" });
        }

        if (req.userRole !== "admin" && caseItem.createdById !== req.userId) {
          const assignedUsers = await storage.getUsersForCase(document.caseId);
          const isAssigned = assignedUsers.some(user => user.id === req.userId);
          
          if (!isAssigned) {
            return res.status(403).json({ message: "Access denied. You must be assigned to this case." });
          }
        }
      } else if (document.folderId) {
        const folder = await storage.getFolderById(document.folderId);
        if (!folder) {
          return res.status(404).json({ message: "Associated folder not found" });
        }

        if (req.userRole !== "admin" && folder.createdById !== req.userId) {
          return res.status(403).json({ message: "Access denied to this folder." });
        }
      }

      res.download(document.filePath, document.name);
    } catch (error) {
      console.error("Download document error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/folders", authenticateToken, async (req: AuthRequest, res) => {
    try {
      let folders;
      if (req.userRole === "admin") {
        folders = await storage.getAllFolders();
      } else {
        folders = await storage.getFoldersByUser(req.userId!);
      }
      
      const foldersWithCount = await Promise.all(
        folders.map(async (folder) => {
          const documents = await storage.getDocumentsByFolder(folder.id);
          return { ...folder, documentCount: documents.length };
        })
      );
      
      res.json(foldersWithCount);
    } catch (error) {
      console.error("Get folders error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/folders", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const folderData = insertFolderSchema.parse({
        ...req.body,
        createdById: req.userId,
      });
      const folder = await storage.createFolder(folderData);
      res.status(201).json({ ...folder, documentCount: 0 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid folder data", errors: error.errors });
      }
      console.error("Create folder error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/folders/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const folder = await storage.getFolderById(id);
      
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }

      if (req.userRole !== "admin" && folder.createdById !== req.userId) {
        return res.status(403).json({ message: "Access denied to this folder" });
      }

      const documents = await storage.getDocumentsByFolder(folder.id);
      res.json({ ...folder, documentCount: documents.length });
    } catch (error) {
      console.error("Get folder error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/folders/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const folder = await storage.getFolderById(id);
      
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }

      if (req.userRole !== "admin" && folder.createdById !== req.userId) {
        return res.status(403).json({ message: "Access denied to this folder" });
      }

      const updates = insertFolderSchema.partial().parse(req.body);
      const updatedFolder = await storage.updateFolder(id, updates);
      
      if (!updatedFolder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      const documents = await storage.getDocumentsByFolder(updatedFolder.id);
      res.json({ ...updatedFolder, documentCount: documents.length });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid folder data", errors: error.errors });
      }
      console.error("Update folder error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/folders/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const folder = await storage.getFolderById(id);
      
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }

      if (req.userRole !== "admin" && folder.createdById !== req.userId) {
        return res.status(403).json({ message: "Access denied to this folder" });
      }

      await storage.deleteFolder(id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message && error.message.includes("Cannot delete folder")) {
        return res.status(400).json({ message: error.message });
      }
      console.error("Delete folder error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/folders/:id/documents", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const folder = await storage.getFolderById(id);
      
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }

      if (req.userRole !== "admin" && folder.createdById !== req.userId) {
        return res.status(403).json({ message: "Access denied to this folder" });
      }
      
      const documents = await storage.getDocumentsByFolder(id);
      res.json(documents);
    } catch (error) {
      console.error("Get folder documents error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:userId/documents", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      
      if (req.userRole !== "admin" && req.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const documents = await storage.getDocumentsByUser(userId);
      res.json(documents);
    } catch (error) {
      console.error("Get user documents error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/roles", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const allRoles = await storage.getAllRoles();
      res.json(allRoles);
    } catch (error) {
      console.error("Get roles error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/roles", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const roleData = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(roleData);
      res.status(201).json(role);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid role data", errors: error.errors });
      }
      console.error("Create role error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/roles/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updates = insertRoleSchema.partial().parse(req.body);
      
      const role = await storage.updateRole(id, updates);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }

      res.json(role);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid role data", errors: error.errors });
      }
      console.error("Update role error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/roles/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteRole(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Role not found" });
      }

      res.status(204).send();
    } catch (error: any) {
      if (error.message?.includes("Cannot delete role")) {
        return res.status(409).json({ message: error.message });
      }
      console.error("Delete role error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/practice-areas", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const allPracticeAreas = await storage.getAllPracticeAreas();
      res.json(allPracticeAreas);
    } catch (error) {
      console.error("Get practice areas error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/practice-areas", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const practiceAreaData = insertPracticeAreaSchema.parse(req.body);
      const practiceArea = await storage.createPracticeArea(practiceAreaData);
      res.status(201).json(practiceArea);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid practice area data", errors: error.errors });
      }
      console.error("Create practice area error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/practice-areas/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updates = insertPracticeAreaSchema.partial().parse(req.body);
      
      const practiceArea = await storage.updatePracticeArea(id, updates);
      if (!practiceArea) {
        return res.status(404).json({ message: "Practice area not found" });
      }

      res.json(practiceArea);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid practice area data", errors: error.errors });
      }
      console.error("Update practice area error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/practice-areas/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deletePracticeArea(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Practice area not found" });
      }

      res.status(204).send();
    } catch (error: any) {
      if (error.message?.includes("Cannot delete practice area")) {
        return res.status(409).json({ message: error.message });
      }
      console.error("Delete practice area error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:id/practice-areas", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const practiceAreas = await storage.getUserPracticeAreas(id);
      res.json(practiceAreas);
    } catch (error) {
      console.error("Get user practice areas error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users/:id/practice-areas", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { practiceAreaId } = req.body;
      
      if (!practiceAreaId) {
        return res.status(400).json({ message: "Practice area ID required" });
      }

      const assignment = await storage.assignPracticeAreaToUser(id, practiceAreaId);
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Assign practice area error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/users/:id/practice-areas/:practiceAreaId", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id, practiceAreaId } = req.params;
      const deleted = await storage.removePracticeAreaFromUser(id, practiceAreaId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Practice area assignment not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Remove practice area error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Settings routes
  app.get("/api/settings", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      let settings = await storage.getSettings();
      
      // If settings don't exist, create default settings
      if (!settings) {
        const defaultSettings = {
          firmName: "CFL Legal",
          firmLocation: "Kilimani, Nairobi",
          firmAddress: "",
          firmPhone: "",
          firmEmail: "",
        };
        settings = await storage.createSettings(defaultSettings);
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/settings", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const updates = insertSettingsSchema.partial().parse(req.body);
      
      let settings = await storage.getSettings();
      
      // If settings don't exist yet, create them
      if (!settings) {
        const settingsData = insertSettingsSchema.parse(req.body);
        settings = await storage.createSettings(settingsData);
      } else {
        settings = await storage.updateSettings(updates);
        if (!settings) {
          return res.status(404).json({ message: "Settings not found" });
        }
      }

      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      }
      console.error("Update settings error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
