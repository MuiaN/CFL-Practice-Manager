import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateToken, verifyPassword, authenticateToken, requireAdmin, type AuthRequest } from "./auth";
import { insertUserSchema, insertCaseSchema, insertDocumentSchema, insertCaseAssignmentSchema } from "@shared/schema";
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

      const token = generateToken(user.id, user.role);
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        token,
        user: userWithoutPassword,
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

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const usersWithoutPasswords = allUsers.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
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
      const updates = req.body;
      
      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
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
      const user = await storage.getUser(req.userId!);
      
      if (user?.role === "admin") {
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
      
      const newCase = await storage.createCase(caseData);
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

      const { caseId } = req.body;
      if (!caseId) {
        return res.status(400).json({ message: "Case ID required" });
      }

      const documentData = {
        name: req.file.originalname,
        type: path.extname(req.file.originalname).substring(1).toUpperCase(),
        size: `${Math.round(req.file.size / 1024)} KB`,
        caseId,
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

  const httpServer = createServer(app);

  return httpServer;
}
