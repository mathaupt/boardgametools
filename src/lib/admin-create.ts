import { hash } from "bcryptjs";
import prisma from "./db";

export async function createAdminUser() {
  const adminEmail = "soulsaver83@gmail.com";
  const adminPassword = "Admin123!"; // You should change this
  
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (existingAdmin) {
      console.log("Admin user already exists");
      return existingAdmin;
    }
    
    // Create admin user
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
    
    console.log("Admin user created successfully:", admin.email);
    return admin;
    
  } catch (error) {
    console.error("Error creating admin user:", error);
    throw error;
  }
}

// Run this function to create the admin user
if (require.main === module) {
  createAdminUser()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
