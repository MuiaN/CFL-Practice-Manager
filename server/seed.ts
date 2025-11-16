import { storage } from "./storage";

/**
 * Standalone database seeding script
 * Run with: npm run db:seed
 * 
 * This script can be run manually to seed the database with initial data.
 * It is idempotent and safe to run multiple times.
 * All operations are atomic - if any step fails, the script exits with error.
 */
async function seed() {
  try {
    console.log("🌱 Seeding database...\n");
    
    // Load existing data once for efficiency
    const existingRoles = await storage.getAllRoles();
    const existingPracticeAreas = await storage.getAllPracticeAreas();
    const existingAdminUser = await storage.getUserByEmail("admin@cfllegal.co.ke");
    
    // Create default roles - fail fast if creation fails
    console.log("📋 Creating roles...");
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
        // Update cache only on successful creation
        existingRoles.push(role);
        console.log(`  ✓ Created role: ${roleData.name}`);
      } else {
        console.log(`  ✓ Role already exists: ${roleData.name}`);
      }
    }
    
    // Create default practice areas - fail fast if creation fails
    console.log("\n⚖️  Creating practice areas...");
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
        // Update cache only on successful creation
        existingPracticeAreas.push(newPA);
        console.log(`  ✓ Created practice area: ${paData.name}`);
      } else {
        console.log(`  ✓ Practice area already exists: ${paData.name}`);
      }
    }
    
    // Create admin user with demo credentials (only if doesn't exist)
    console.log("\n👤 Creating admin user...");
    if (!existingAdminUser) {
      // Get the admin role, ensuring it exists
      const allRoles = await storage.getAllRoles();
      const adminRole = allRoles.find(r => r.name === "admin");
      
      if (!adminRole) {
        throw new Error("Cannot create admin user: admin role not found");
      }
      
      // Password will be hashed by storage.createUser - fail fast if creation fails
      await storage.createUser({
        email: "admin@cfllegal.co.ke",
        password: "admin123",
        name: "System Administrator",
        roleId: adminRole.id,
        isActive: "true",
      });
      console.log("  ✓ Admin user created");
      console.log("    Email: admin@cfllegal.co.ke");
      console.log("    Password: admin123");
    } else {
      console.log("  ✓ Admin user already exists");
      console.log("    Email: admin@cfllegal.co.ke");
    }
    
    console.log("\n✨ Seeding complete!\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    console.error("Database may be in an incomplete state.");
    console.error("Please fix the error and run the seed script again.\n");
    process.exit(1);
  }
}

seed();
