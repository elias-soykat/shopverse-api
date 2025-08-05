const { User, Category, Product } = require("../models");
const bcrypt = require("bcryptjs");

const seedData = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    // Create admin user
    const adminUser = await User.create({
      firstName: "Admin",
      lastName: "User",
      email: "admin@shopverse.com",
      password: "admin123",
      role: "admin",
      phone: "+1234567890",
      address: "123 Admin Street, Admin City, AC 12345",
      isActive: true,
    });

    console.log("✅ Admin user created:", adminUser.email);

    // Create sample customer
    const customerUser = await User.create({
      firstName: "John",
      lastName: "Doe",
      email: "customer@shopverse.com",
      password: "customer123",
      role: "customer",
      phone: "+1987654321",
      address: "456 Customer Ave, Customer City, CC 54321",
      isActive: true,
    });

    console.log("✅ Customer user created:", customerUser.email);

    // Create categories
    const categories = await Category.bulkCreate([
      {
        name: "Electronics",
        description: "Latest electronic devices and gadgets",
        slug: "electronics",
        imageUrl:
          "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400",
        isActive: true,
      },
      {
        name: "Clothing",
        description: "Fashion and apparel for all ages",
        slug: "clothing",
        imageUrl:
          "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400",
        isActive: true,
      },
      {
        name: "Home & Garden",
        description: "Home improvement and garden supplies",
        slug: "home-garden",
        imageUrl:
          "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400",
        isActive: true,
      },
      {
        name: "Books",
        description: "Books, magazines, and educational materials",
        slug: "books",
        imageUrl:
          "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
        isActive: true,
      },
      {
        name: "Sports & Outdoors",
        description: "Sports equipment and outdoor gear",
        slug: "sports-outdoors",
        imageUrl:
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
        isActive: true,
      },
    ]);

    console.log("✅ Categories created:", categories.length);

    // Create products
    const products = await Product.bulkCreate([
      {
        name: "iPhone 15 Pro",
        description:
          "The most advanced iPhone ever with A17 Pro chip, titanium design, and pro camera system.",
        price: 999.99,
        stock: 50,
        categoryId: 1, // Electronics
        sku: "IPH15PRO-001",
        slug: "iphone-15-pro",
        images: [
          "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400",
          "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400",
        ],
        isActive: true,
        isFeatured: true,
        weight: 187.0,
        dimensions: { length: 146.7, width: 71.5, height: 8.25 },
      },
      {
        name: 'MacBook Pro 14"',
        description:
          "Powerful laptop with M3 chip, perfect for professionals and creatives.",
        price: 1999.99,
        stock: 25,
        categoryId: 1, // Electronics
        sku: "MBP14-001",
        slug: "macbook-pro-14",
        images: [
          "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
          "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
        ],
        isActive: true,
        isFeatured: true,
        weight: 1600.0,
        dimensions: { length: 312.6, width: 221.2, height: 15.5 },
      },
      {
        name: "Samsung 4K Smart TV",
        description:
          "55-inch 4K Ultra HD Smart TV with Crystal Display and Alexa Built-in.",
        price: 699.99,
        stock: 30,
        categoryId: 1, // Electronics
        sku: "SAMSUNG-TV-001",
        slug: "samsung-4k-smart-tv",
        images: [
          "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400",
          "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400",
        ],
        isActive: true,
        isFeatured: false,
        weight: 18000.0,
        dimensions: { length: 1232.0, width: 708.0, height: 89.0 },
      },
      {
        name: "Nike Air Max 270",
        description:
          "Comfortable running shoes with Air Max technology for maximum cushioning.",
        price: 129.99,
        stock: 100,
        categoryId: 2, // Clothing
        sku: "NIKE-AM270-001",
        slug: "nike-air-max-270",
        images: [
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
        ],
        isActive: true,
        isFeatured: true,
        weight: 300.0,
        dimensions: { length: 30.0, width: 12.0, height: 8.0 },
      },
      {
        name: "Levi's 501 Original Jeans",
        description:
          "Classic straight-fit jeans in authentic denim with button fly.",
        price: 89.99,
        stock: 75,
        categoryId: 2, // Clothing
        sku: "LEVIS-501-001",
        slug: "levis-501-original-jeans",
        images: [
          "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
          "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
        ],
        isActive: true,
        isFeatured: false,
        weight: 400.0,
        dimensions: { length: 40.0, width: 30.0, height: 2.0 },
      },
      {
        name: "Garden Tool Set",
        description:
          "Complete set of essential garden tools including shovel, rake, and pruners.",
        price: 79.99,
        stock: 40,
        categoryId: 3, // Home & Garden
        sku: "GARDEN-TOOLS-001",
        slug: "garden-tool-set",
        images: [
          "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
          "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
        ],
        isActive: true,
        isFeatured: false,
        weight: 2500.0,
        dimensions: { length: 60.0, width: 30.0, height: 15.0 },
      },
      {
        name: "The Great Gatsby",
        description:
          "F. Scott Fitzgerald's masterpiece about the Jazz Age and the American Dream.",
        price: 12.99,
        stock: 200,
        categoryId: 4, // Books
        sku: "BOOK-GATSBY-001",
        slug: "the-great-gatsby",
        images: [
          "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
          "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
        ],
        isActive: true,
        isFeatured: true,
        weight: 250.0,
        dimensions: { length: 20.0, width: 13.0, height: 2.0 },
      },
      {
        name: "Yoga Mat Premium",
        description:
          "Non-slip yoga mat made from eco-friendly materials, perfect for home workouts.",
        price: 49.99,
        stock: 60,
        categoryId: 5, // Sports & Outdoors
        sku: "YOGA-MAT-001",
        slug: "yoga-mat-premium",
        images: [
          "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
          "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
        ],
        isActive: true,
        isFeatured: false,
        weight: 1500.0,
        dimensions: { length: 183.0, width: 61.0, height: 0.6 },
      },
      {
        name: "Wireless Bluetooth Headphones",
        description:
          "High-quality wireless headphones with noise cancellation and 30-hour battery life.",
        price: 199.99,
        stock: 45,
        categoryId: 1, // Electronics
        sku: "BT-HEADPHONES-001",
        slug: "wireless-bluetooth-headphones",
        images: [
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
        ],
        isActive: true,
        isFeatured: true,
        weight: 250.0,
        dimensions: { length: 18.0, width: 16.0, height: 8.0 },
      },
      {
        name: "Coffee Maker Deluxe",
        description:
          "Programmable coffee maker with thermal carafe and built-in grinder.",
        price: 149.99,
        stock: 35,
        categoryId: 3, // Home & Garden
        sku: "COFFEE-MAKER-001",
        slug: "coffee-maker-deluxe",
        images: [
          "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400",
          "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400",
        ],
        isActive: true,
        isFeatured: false,
        weight: 3500.0,
        dimensions: { length: 35.0, width: 25.0, height: 40.0 },
      },
    ]);

    console.log("✅ Products created:", products.length);

    console.log("🎉 Database seeding completed successfully!");
    console.log("\n📋 Sample Data Summary:");
    console.log("- Admin User: admin@shopverse.com (password: admin123)");
    console.log(
      "- Customer User: customer@shopverse.com (password: customer123)"
    );
    console.log("- Categories:", categories.length);
    console.log("- Products:", products.length);
    console.log("\n🚀 You can now start testing the API!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
};

module.exports = seedData;
