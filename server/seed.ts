import { storage } from "./storage";

async function seed() {
  try {
    console.log("Seeding database...");
    
    const existingUser = await storage.getUserByEmail("admin@cfllegal.co.ke");
    
    if (!existingUser) {
      await storage.createUser({
        email: "admin@cfllegal.co.ke",
        password: "admin123",
        name: "System Administrator",
        role: "admin",
        practiceAreas: [],
        isActive: "true",
      });
      console.log("✓ Admin user created");
      console.log("  Email: admin@cfllegal.co.ke");
      console.log("  Password: admin123");
    } else {
      console.log("✓ Admin user already exists");
    }
    
    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seed();
