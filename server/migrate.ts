import { db } from "./db";
import { sql } from "drizzle-orm";

async function migrate() {
  try {
    console.log("Starting migration...");

    console.log("1. Creating roles table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS roles (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    console.log("2. Creating practice_areas table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS practice_areas (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    console.log("3. Creating user_practice_areas junction table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_practice_areas (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        practice_area_id VARCHAR NOT NULL REFERENCES practice_areas(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    console.log("4. Seeding default roles...");
    await db.execute(sql`
      INSERT INTO roles (name, description) VALUES
        ('Admin', 'Full system access and user management'),
        ('Senior Associate', 'Senior legal professional with elevated privileges'),
        ('Associate', 'Standard legal professional access')
      ON CONFLICT (name) DO NOTHING
    `);

    console.log("5. Seeding default practice areas...");
    await db.execute(sql`
      INSERT INTO practice_areas (name, description) VALUES
        ('Corporate & Commercial', 'Corporate law and commercial transactions'),
        ('Intellectual Property', 'Patents, trademarks, and IP rights'),
        ('Real Estate', 'Property law and real estate transactions'),
        ('Banking & Finance', 'Financial services and banking regulations'),
        ('Dispute Resolution', 'Litigation and alternative dispute resolution'),
        ('TMT', 'Technology, Media, and Telecommunications')
      ON CONFLICT (name) DO NOTHING
    `);

    console.log("6. Adding role_id column to users...");
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id VARCHAR REFERENCES roles(id)
    `);

    console.log("7. Migrating user roles...");
    const adminRoleId = await db.execute(sql`SELECT id FROM roles WHERE name = 'Admin'`);
    const seniorRoleId = await db.execute(sql`SELECT id FROM roles WHERE name = 'Senior Associate'`);
    const associateRoleId = await db.execute(sql`SELECT id FROM roles WHERE name = 'Associate'`);

    if (adminRoleId.rows[0]) {
      await db.execute(sql`
        UPDATE users SET role_id = ${adminRoleId.rows[0].id}
        WHERE role = 'admin'
      `);
    }
    if (seniorRoleId.rows[0]) {
      await db.execute(sql`
        UPDATE users SET role_id = ${seniorRoleId.rows[0].id}
        WHERE role = 'senior_associate'
      `);
    }
    if (associateRoleId.rows[0]) {
      await db.execute(sql`
        UPDATE users SET role_id = ${associateRoleId.rows[0].id}
        WHERE role = 'associate'
      `);
    }

    console.log("8. Dropping old role column from users...");
    await db.execute(sql`ALTER TABLE users DROP COLUMN IF EXISTS role`);

    console.log("9. Dropping old practice_areas column from users...");
    await db.execute(sql`ALTER TABLE users DROP COLUMN IF EXISTS practice_areas`);

    console.log("10. Adding practice_area_id column to cases...");
    await db.execute(sql`
      ALTER TABLE cases ADD COLUMN IF NOT EXISTS practice_area_id VARCHAR REFERENCES practice_areas(id)
    `);

    console.log("11. Migrating case practice areas...");
    const practiceAreaMap: Record<string, string> = {
      'corporate_commercial': 'Corporate & Commercial',
      'intellectual_property': 'Intellectual Property',
      'real_estate': 'Real Estate',
      'banking_finance': 'Banking & Finance',
      'dispute_resolution': 'Dispute Resolution',
      'tmt': 'TMT'
    };

    for (const [oldName, newName] of Object.entries(practiceAreaMap)) {
      const paResult = await db.execute(sql`SELECT id FROM practice_areas WHERE name = ${newName}`);
      if (paResult.rows[0]) {
        await db.execute(sql`
          UPDATE cases SET practice_area_id = ${paResult.rows[0].id}
          WHERE practice_area = ${oldName}
        `);
      }
    }

    console.log("12. Dropping old practice_area column from cases...");
    await db.execute(sql`ALTER TABLE cases DROP COLUMN IF EXISTS practice_area`);

    console.log("13. Dropping old enums...");
    await db.execute(sql`DROP TYPE IF EXISTS user_role CASCADE`);
    await db.execute(sql`DROP TYPE IF EXISTS practice_area CASCADE`);

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

migrate();
