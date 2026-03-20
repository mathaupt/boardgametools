import { hash } from "bcryptjs";
import prisma from "./db";

export async function createAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set");
  }
  
  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (existingAdmin) {
      console.log("Admin user already exists");
      return existingAdmin;
    }
    
    const passwordHash = await hash(adminPassword, 12);
    
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: "Admin",
        role: "ADMIN",
        isActive: true
      }
    });
    
    console.log("Admin user created successfully");
    return admin;
    
  } catch (error) {
    console.error("Error creating admin user:", error);
    throw error;
  }
}

if (require.main === module) {
  createAdminUser()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
