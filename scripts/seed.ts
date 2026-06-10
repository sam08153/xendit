
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/user.model';
import { UserRole } from '../src/types/user.types';
import Restaurant from '../src/models/restaurant.model';
import MenuItem from '../src/models/menu.model';
import { Reward } from '../src/models/loyalty.model';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/food-delivery';

const seedData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Drop existing collections
    await mongoose.connection.dropDatabase();
    console.log('Cleared existing data');

    // Create sample users
    const _adminUser = await User.create({
      email: 'admin@example.com',
      password: 'password123',
      name: 'Admin User',
      phone: '+1111111111',
      address: {
        street: '1 Admin St',
        city: 'Admin City',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      },
      role: UserRole.ADMIN
    });

    const restaurantUser = await User.create({
      email: 'restaurant@example.com',
      password: 'password123',
      name: 'Restaurant Owner',
      phone: '+1222222222',
      address: {
        street: '2 Restaurant Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '10002',
        country: 'USA'
      },
      role: UserRole.RESTAURANT
    });

    const _customerUser = await User.create({
      email: 'customer@example.com',
      password: 'password123',
      name: 'John Customer',
      phone: '+1333333333',
      address: {
        street: '3 Customer Rd',
        city: 'New York',
        state: 'NY',
        zipCode: '10003',
        country: 'USA'
      },
      role: UserRole.CUSTOMER
    });

    const _deliveryUser = await User.create({
      email: 'delivery@example.com',
      password: 'password123',
      name: 'Delivery Person',
      phone: '+1444444444',
      address: {
        street: '4 Delivery Ln',
        city: 'New York',
        state: 'NY',
        zipCode: '10004',
        country: 'USA'
      },
      role: UserRole.DELIVERY
    });

    // Create sample restaurants
    const restaurants = await Restaurant.create([
      {
        ownerId: restaurantUser._id,
        name: 'Delicious Eats',
        description: 'Authentic Italian cuisine in the heart of New York!',
        logo: 'https://example.com/logo.jpg',
        address: {
          street: '456 Food St',
          city: 'New York',
          state: 'NY',
          zipCode: '10002',
          country: 'USA'
        },
        location: {
          type: 'Point',
          coordinates: [-74.0060, 40.7128]
        },
        cuisine: ['Italian', 'Pizza', 'Pasta'],
        operatingHours: {
          monday: { open: '09:00', close: '22:00' },
          tuesday: { open: '09:00', close: '22:00' },
          wednesday: { open: '09:00', close: '22:00' },
          thursday: { open: '09:00', close: '22:00' },
          friday: { open: '09:00', close: '23:00' },
          saturday: { open: '10:00', close: '23:00' },
          sunday: { open: '10:00', close: '22:00' }
        },
        contactPhone: '+1987654321',
        rating: 4.5,
        averageDeliveryTime: 30,
        minimumOrderValue: 15
      },
      {
        ownerId: restaurantUser._id,
        name: 'Midnight Diner',
        description: '24/7 comfort food for late-night cravings!',
        logo: 'https://example.com/diner-logo.jpg',
        address: {
          street: '789 Late Night Blvd',
          city: 'New York',
          state: 'NY',
          zipCode: '10003',
          country: 'USA'
        },
        location: {
          type: 'Point',
          coordinates: [-74.0050, 40.7130]
        },
        cuisine: ['American', 'Burgers', 'Breakfast'],
        operatingHours: {
          monday: { open: '00:00', close: '23:59' },
          tuesday: { open: '00:00', close: '23:59' },
          wednesday: { open: '00:00', close: '23:59' },
          thursday: { open: '00:00', close: '23:59' },
          friday: { open: '00:00', close: '23:59' },
          saturday: { open: '00:00', close: '23:59' },
          sunday: { open: '00:00', close: '23:59' }
        },
        contactPhone: '+1987654322',
        rating: 4.2,
        averageDeliveryTime: 20,
        minimumOrderValue: 10
      },
      {
        ownerId: restaurantUser._id,
        name: 'Sushi Palace',
        description: 'Fresh and authentic Japanese sushi and rolls!',
        logo: 'https://example.com/sushi-logo.jpg',
        address: {
          street: '321 East St',
          city: 'New York',
          state: 'NY',
          zipCode: '10004',
          country: 'USA'
        },
        location: {
          type: 'Point',
          coordinates: [-74.0070, 40.7110]
        },
        cuisine: ['Japanese', 'Sushi', 'Asian'],
        operatingHours: {
          monday: { open: '11:00', close: '23:00' },
          tuesday: { open: '11:00', close: '23:00' },
          wednesday: { open: '11:00', close: '23:00' },
          thursday: { open: '11:00', close: '23:00' },
          friday: { open: '11:00', close: '00:00' },
          saturday: { open: '12:00', close: '00:00' },
          sunday: { open: '12:00', close: '22:00' }
        },
        contactPhone: '+1987654323',
        rating: 4.8,
        averageDeliveryTime: 35,
        minimumOrderValue: 20
      }
    ]);

    // Create sample menu items
    const menuItems = [
      // Delicious Eats menu items
      {
        restaurantId: restaurants[0]._id,
        name: 'Margherita Pizza',
        description: 'Classic pizza with San Marzano tomatoes, fresh mozzarella, and fresh basil.',
        price: 14.99,
        image: 'https://example.com/margherita.jpg',
        category: 'Pizza',
        tags: ['vegetarian', 'classic'],
        dietaryRestrictions: ['vegetarian'],
        allergens: ['dairy', 'gluten'],
        spiceLevel: 1,
        isAvailable: true,
        customizationOptions: [
          {
            name: 'Extra Cheese',
            options: [
              { name: 'No', price: 0 },
              { name: 'Yes', price: 2.00 }
            ],
            required: false,
            multiSelect: false
          }
        ],
        orderCount: 150
      },
      {
        restaurantId: restaurants[0]._id,
        name: 'Spicy Arrabbiata Pasta',
        description: 'Penne pasta in a spicy tomato sauce with garlic and chili flakes.',
        price: 12.99,
        image: 'https://example.com/arrabbiata.jpg',
        category: 'Pasta',
        tags: ['spicy', 'pasta'],
        dietaryRestrictions: [],
        allergens: ['gluten'],
        spiceLevel: 4,
        isAvailable: true,
        customizationOptions: [],
        orderCount: 100
      },
      // Midnight Diner menu items
      {
        restaurantId: restaurants[1]._id,
        name: 'Classic Cheeseburger',
        description: 'Juicy beef patty with cheese, lettuce, tomato, and special sauce.',
        price: 9.99,
        image: 'https://example.com/burger.jpg',
        category: 'Burgers',
        tags: ['classic', 'comfort'],
        dietaryRestrictions: [],
        allergens: ['dairy', 'gluten'],
        spiceLevel: 1,
        isAvailable: true,
        customizationOptions: [],
        orderCount: 200
      },
      {
        restaurantId: restaurants[1]._id,
        name: 'Pancake Stack',
        description: 'Fluffy buttermilk pancakes with maple syrup and butter.',
        price: 7.99,
        image: 'https://example.com/pancakes.jpg',
        category: 'Breakfast',
        tags: ['sweet', 'breakfast'],
        dietaryRestrictions: ['vegetarian'],
        allergens: ['dairy', 'gluten', 'eggs'],
        spiceLevel: 0,
        isAvailable: true,
        customizationOptions: [],
        orderCount: 120
      },
      // Sushi Palace menu items
      {
        restaurantId: restaurants[2]._id,
        name: 'California Roll',
        description: 'Crab meat, avocado, and cucumber wrapped in seaweed and rice.',
        price: 12.99,
        image: 'https://example.com/california.jpg',
        category: 'Sushi',
        tags: ['classic', 'maki'],
        dietaryRestrictions: [],
        allergens: ['fish', 'soy'],
        spiceLevel: 0,
        isAvailable: true,
        customizationOptions: [],
        orderCount: 180
      },
      {
        restaurantId: restaurants[2]._id,
        name: 'Spicy Tuna Roll',
        description: 'Fresh tuna with spicy mayo and scallions.',
        price: 14.99,
        image: 'https://example.com/spicy-tuna.jpg',
        category: 'Sushi',
        tags: ['spicy', 'maki'],
        dietaryRestrictions: [],
        allergens: ['fish', 'soy'],
        spiceLevel: 3,
        isAvailable: true,
        customizationOptions: [],
        orderCount: 140
      }
    ];
    
    await MenuItem.create(menuItems);

    // Create sample rewards
    await Reward.create([
      {
        name: '10% Off Order',
        description: '10% discount on your next order!',
        pointsCost: 50,
        discountType: 'percentage',
        discountValue: 10,
        isActive: true
      },
      {
        name: '$5 Off Order',
        description: '$5 discount on your next order!',
        pointsCost: 80,
        discountType: 'fixed',
        discountValue: 5,
        isActive: true
      }
    ]);

    console.log('Database seeded successfully!');
    console.log('Sample users created:');
    console.log('- Admin: admin@example.com');
    console.log('- Restaurant: restaurant@example.com');
    console.log('- Customer: customer@example.com');
    console.log('- Delivery: delivery@example.com');
    console.log('All users password: password123');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
