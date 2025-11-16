import { storage } from "./storage";

/**
 * Auto-seed database on server startup (development only)
 * Throws on any error to ensure database is properly initialized before server starts
 */
export async function runSeed() {
  // Only auto-seed in development mode
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.log("🌱 Auto-seeding database...");
  
  // Load existing data once for efficiency
  const existingRoles = await storage.getAllRoles();
  const existingPracticeAreas = await storage.getAllPracticeAreas();
  const existingAdminUser = await storage.getUserByEmail("admin@cfllegal.co.ke");
  
  // Create default roles - throws on error
  const roleNames = [
    { name: "admin", description: "System administrator with full access" },
    { name: "lawyer", description: "Legal practitioner handling cases" },
    { name: "paralegal", description: "Legal assistant supporting lawyers" },
    { name: "client", description: "Client with limited access to their cases" },
  ];
  
  for (const roleData of roleNames) {
    const existingRole = existingRoles.find(r => r.name === roleData.name);
    
    if (!existingRole) {
      const role = await storage.createRole(roleData);
      existingRoles.push(role);
    }
  }
  
  // Create default practice areas - throws on error
  const practiceAreaNames = [
    { name: "Corporate Law", description: "Business formation, mergers, acquisitions, and corporate governance" },
    { name: "Intellectual Property", description: "Patents, trademarks, copyrights, and trade secrets" },
    { name: "Real Estate", description: "Property transactions, leases, and real estate disputes" },
    { name: "Banking & Finance", description: "Financial regulations, lending, and securities" },
    { name: "Dispute Resolution", description: "Litigation, arbitration, and mediation" },
  ];
  
  for (const paData of practiceAreaNames) {
    const existingPA = existingPracticeAreas.find(pa => pa.name === paData.name);
    
    if (!existingPA) {
      const newPA = await storage.createPracticeArea(paData);
      existingPracticeAreas.push(newPA);
    }
  }
  
  // Create admin user with demo credentials (only if doesn't exist)
  if (!existingAdminUser) {
    // Get the admin role, ensuring it exists
    const allRoles = await storage.getAllRoles();
    const adminRole = allRoles.find(r => r.name === "admin");
    
    if (!adminRole) {
      throw new Error("Cannot create admin user: admin role not found");
    }
    
    // Password will be hashed by storage.createUser - throws on error
    await storage.createUser({
      email: "admin@cfllegal.co.ke",
      password: "admin123",
      name: "System Administrator",
      roleId: adminRole.id,
      isActive: "true",
    });
    console.log("✓ Admin user created with demo credentials");
  }
  
  console.log("✓ Database seeding complete");
}
