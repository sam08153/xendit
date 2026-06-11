
# Food Delivery App - Implementation Overview

## Overview of Implemented Features

This implementation completes all 6 tasks for the food delivery app:

### 1. Advanced Search and Filtering (Task 1)
- **Restaurant Filters**:
  - Distance (using geospatial queries with MongoDB 2dsphere index)
  - Operating hours (filter currently open restaurants)
  - Average delivery time
  - Minimum order value
- **Menu Item Filters**:
  - Dietary restrictions (vegetarian, vegan, gluten-free)
  - Allergen exclusion
  - Spice level (0-5)
  - Popularity (most ordered)
- **Sorting Options**:
  - Restaurants: rating, delivery time, min order, name
  - Menu items: price (asc/desc), popularity, name

### 2. Order Scheduling (Task 2)
- Schedule orders for future delivery date/time
- Validate restaurant is open at scheduled delivery time
- Update scheduled delivery time
- View, modify, and cancel scheduled orders
- Track scheduled status with `isScheduled` flag

### 3. Loyalty Program (Task 3)
- **Points System**: Earn points based on order total and user tier
- **Tier System**:
  - Bronze (default): 1x multiplier
  - Silver (500 pts): 1.5x multiplier
  - Gold (1500 pts): 2x multiplier
  - Platinum (3000 pts): 3x multiplier
- Points expire after 30 days
- Endpoints to check balance, view history, redeem rewards
- Track points per transaction with order references

### 4. Real‑time Order Notifications (Task 4)
- WebSocket‑based real‑time communication using Socket.io
- Notifications for order status changes
- Real‑time delivery tracking
- Custom restaurant‑to‑customer messages
- JWT‑based WebSocket authentication

### 5. Analytics Dashboard API (Task 5)
- Sales data aggregated by day/week/month
- Key metrics:
  - Total revenue
  - Total orders
  - Average order value (AOV)
  - Customer retention
- Popular menu items
- Peak ordering times
- Restaurant‑restricted access

### 6. Multi‑language Support (Task 6)
- Supported languages: English (en), Spanish (es), French (fr)
- Language detection from:
  - Query parameter (`?lang=es`)
  - `Accept-Language` header
- Fallback to English if translation is missing
- Easy to add new languages by creating new translation files

---

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or using Docker)

### Installation Steps

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd xendit-take-home-test
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start MongoDB:
   - Option 1 (Docker):
     ```bash
     docker-compose up -d
     ```
   - Option 2 (Local): Ensure local MongoDB is running on default port 27017

4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set your configuration values (JWT secret, MongoDB URI, etc.)

5. Seed the database with sample data:
   ```bash
   npm run seed
   ```
   This will create:
   - Admin user: `admin@example.com`
   - Restaurant owner: `restaurant@example.com`
   - Customer: `customer@example.com`
   - Delivery person: `delivery@example.com`
   - All users have the password: `password123`
   - A sample restaurant, menu items, and loyalty rewards

6. Start the development server:
   ```bash
   npm run dev
   ```
   The server will start at `http://localhost:5000`

---

## Testing

### Run Tests
```bash
npm test
```

### Check Linting
```bash
npm run lint
```

### Build for Production
```bash
npm run build
npm start
```

---

## API Documentation for New Endpoints

### Importing Postman Collection
1. Open Postman
2. Click `Import`
3. Import both:
   - `Food Delivery App.postman_collection.json`
   - `Food Delivery App.postman_environment.json`
4. Select the "Food Delivery App - Local" environment

### Postman Setup Instructions
1. **Base URL**: `http://localhost:5000`
2. **Authorization**: Use Bearer Token for protected endpoints. Token is obtained from the login response.
3. **Environment Variables** (recommended):
   - `baseUrl`: `http://localhost:5000`
   - `token`: JWT token from login
   - `restaurantId`: ID of a restaurant from your database
   - `menuItemId`: ID of a menu item from your database
   - `orderId`: ID of an order from your database

---

### 1. Authentication Endpoints (`/api/auth`)
- **Register**:
  - Method: POST
  - URL: `{{baseUrl}}/api/auth/register`
  - Body (JSON):
    ```json
    {
      "email": "your.email@example.com",
      "password": "yourpassword123",
      "name": "Your Name",
      "phone": "+1234567890",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA"
      }
    }
    ```

- **Login**:
  - Method: POST
  - URL: `{{baseUrl}}/api/auth/login`
  - Body (JSON):
    ```json
    {
      "email": "your.email@example.com",
      "password": "yourpassword123"
    }
    ```

- **Get Profile**:
  - Method: GET
  - URL: `{{baseUrl}}/api/auth/me`
  - Headers: `Authorization: Bearer {{token}}`

---

### 2. Restaurant Endpoints (`/api/restaurants`)
- **Get All Restaurants (with filters)**:
  - Method: GET
  - URL: `{{baseUrl}}/api/restaurants`
  - Query Params:
    - `lat`: User's latitude
    - `lng`: User's longitude
    - `maxDistance`: Maximum search distance in meters
    - `isOpenNow`: true/false
    - `maxDeliveryTime`: Maximum delivery time in minutes
    - `minOrderValue`: Minimum order value
    - `sortBy`: rating/deliveryTime/minOrder/name

- **Get Nearby Restaurants**:
  - Method: GET
  - URL: `{{baseUrl}}/api/restaurants/nearby`
  - Query Params: `lat`, `lng`, `maxDistance`

- **Get Restaurant by ID**:
  - Method: GET
  - URL: `{{baseUrl}}/api/restaurants/{{restaurantId}}`

- **Create Restaurant**:
  - Method: POST
  - URL: `{{baseUrl}}/api/restaurants`
  - Headers: `Authorization: Bearer {{token}}` (RESTAURANT/ADMIN role)
  - Body (JSON):
    ```json
    {
      "ownerId": "{{userId}}",
      "name": "Delicious Eats",
      "description": "Best food in town",
      "logo": "https://example.com/logo.jpg",
      "address": {
        "street": "456 Food St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10002",
        "country": "USA"
      },
      "location": {
        "type": "Point",
        "coordinates": [-74.0060, 40.7128]
      },
      "cuisine": ["Italian", "Pizza"],
      "operatingHours": {
        "monday": { "open": "09:00", "close": "22:00" },
        "tuesday": { "open": "09:00", "close": "22:00" },
        "wednesday": { "open": "09:00", "close": "22:00" },
        "thursday": { "open": "09:00", "close": "22:00" },
        "friday": { "open": "09:00", "close": "23:00" },
        "saturday": { "open": "10:00", "close": "23:00" },
        "sunday": { "open": "10:00", "close": "22:00" }
      },
      "contactPhone": "+1987654321",
      "averageDeliveryTime": 30,
      "minimumOrderValue": 15
    }
    ```

---

### 3. Menu Endpoints (`/api/menu`)
- **Get Menu Items by Restaurant**:
  - Method: GET
  - URL: `{{baseUrl}}/api/menu/restaurant/{{restaurantId}}`

- **Search Menu Items**:
  - Method: GET
  - URL: `{{baseUrl}}/api/menu/search`
  - Query Params:
    - `q`: Search query
    - `dietaryRestrictions[]`: Vegetarian/Vegan/Gluten-Free
    - `allergens[]`: Exclude items with these allergens
    - `spiceLevelMin`: Minimum spice level (0-5)
    - `spiceLevelMax`: Maximum spice level (0-5)
    - `restaurantId`: Filter by restaurant
    - `sortBy`: price/priceDesc/popularity/name

- **Get Menu Item by ID**:
  - Method: GET
  - URL: `{{baseUrl}}/api/menu/{{menuItemId}}`

- **Create Menu Item**:
  - Method: POST
  - URL: `{{baseUrl}}/api/menu`
  - Headers: `Authorization: Bearer {{token}}` (RESTAURANT/ADMIN role)
  - Body (JSON):
    ```json
    {
      "restaurantId": "{{restaurantId}}",
      "name": "Margherita Pizza",
      "description": "Classic pizza with tomato, mozzarella, and basil",
      "price": 14.99,
      "image": "https://example.com/pizza.jpg",
      "category": "Pizza",
      "tags": ["vegetarian"],
      "dietaryRestrictions": ["vegetarian"],
      "allergens": ["dairy"],
      "spiceLevel": 1,
      "isAvailable": true,
      "customizationOptions": [
        {
          "name": "Extra Cheese",
          "options": [
            {"name": "No", "price": 0},
            {"name": "Yes", "price": 2.00}
          ],
          "required": false,
          "multiSelect": false
        }
      ]
    }
    ```

---

### 4. Order Endpoints (`/api/orders`)
- **Create Order (with scheduling support)**:
  - Method: POST
  - URL: `{{baseUrl}}/api/orders`
  - Headers: `Authorization: Bearer {{token}}` (CUSTOMER role)
  - Body (JSON):
    ```json
    {
      "restaurantId": "{{restaurantId}}",
      "items": [
        {
          "menuItemId": "{{menuItemId}}",
          "quantity": 2,
          "customizations": [
            {"name": "Extra Cheese", "value": "Yes"}
          ]
        }
      ],
      "deliveryAddress": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA"
      },
      "specialInstructions": "Please leave at the front desk",
      "scheduledDeliveryTime": "2026-06-12T19:00:00.000Z"
    }
    ```

- **Update Scheduled Order**:
  - Method: PUT
  - URL: `{{baseUrl}}/api/orders/{{orderId}}/schedule`
  - Headers: `Authorization: Bearer {{token}}` (CUSTOMER role)
  - Body (JSON):
    ```json
    {
      "scheduledDeliveryTime": "2026-06-12T20:00:00.000Z",
      "specialInstructions": "New instructions"
    }
    ```

- **Get All Orders**:
  - Method: GET
  - URL: `{{baseUrl}}/api/orders`
  - Query Params: `isScheduled=true/false`
  - Headers: `Authorization: Bearer {{token}}`

- **Get Order by ID**:
  - Method: GET
  - URL: `{{baseUrl}}/api/orders/{{orderId}}`
  - Headers: `Authorization: Bearer {{token}}`

- **Update Order Status**:
  - Method: PUT
  - URL: `{{baseUrl}}/api/orders/{{orderId}}/status`
  - Headers: `Authorization: Bearer {{token}}`
  - Body (JSON):
    ```json
    {
      "status": "preparing"
    }
    ```

- **Cancel Order**:
  - Method: DELETE
  - URL: `{{baseUrl}}/api/orders/{{orderId}}`
  - Headers: `Authorization: Bearer {{token}}`

---

### 5. Delivery Endpoints (`/api/delivery`)
- **Get Available Delivery Personnel**:
  - Method: GET
  - URL: `{{baseUrl}}/api/delivery/personnel`
  - Headers: `Authorization: Bearer {{token}}` (ADMIN only)

- **Get Orders for Delivery**:
  - Method: GET
  - URL: `{{baseUrl}}/api/delivery/orders`
  - Headers: `Authorization: Bearer {{token}}` (DELIVERY only)

- **Update Delivery Location**:
  - Method: POST
  - URL: `{{baseUrl}}/api/delivery/location`
  - Headers: `Authorization: Bearer {{token}}` (DELIVERY only)
  - Body (JSON):
    ```json
    {
      "latitude": 40.7128,
      "longitude": -74.0060
    }
    ```

- **Track Delivery**:
  - Method: GET
  - URL: `{{baseUrl}}/api/delivery/orders/{{orderId}}/track`
  - Headers: `Authorization: Bearer {{token}}`

- **Estimate Delivery Time**:
  - Method: GET
  - URL: `{{baseUrl}}/api/delivery/orders/{{orderId}}/eta`
  - Headers: `Authorization: Bearer {{token}}`

---

### 6. Payment Endpoints (`/api/payments`)
- **Process Payment**:
  - Method: POST
  - URL: `{{baseUrl}}/api/payments/process`
  - Headers: `Authorization: Bearer {{token}}` (CUSTOMER only)
  - Body (JSON):
    ```json
    {
      "orderId": "{{orderId}}",
      "paymentMethod": "credit_card",
      "cardNumber": "4111111111111111",
      "cardExpiry": "12/28",
      "cardCvv": "123"
    }
    ```

- **Get Payment Status**:
  - Method: GET
  - URL: `{{baseUrl}}/api/payments/{{orderId}}/status`
  - Headers: `Authorization: Bearer {{token}}`

- **Refund Payment**:
  - Method: POST
  - URL: `{{baseUrl}}/api/payments/{{orderId}}/refund`
  - Headers: `Authorization: Bearer {{token}}` (ADMIN/RESTAURANT only)

---

### 7. Loyalty Program Endpoints (`/api/loyalty`)
- **Get Loyalty Profile**:
  - Method: GET
  - URL: `{{baseUrl}}/api/loyalty/profile`
  - Headers: `Authorization: Bearer {{token}}` (CUSTOMER only)

- **Get Point History**:
  - Method: GET
  - URL: `{{baseUrl}}/api/loyalty/history`
  - Headers: `Authorization: Bearer {{token}}` (CUSTOMER only)

- **Get Available Rewards**:
  - Method: GET
  - URL: `{{baseUrl}}/api/loyalty/rewards`
  - Headers: `Authorization: Bearer {{token}}`

- **Redeem Reward**:
  - Method: POST
  - URL: `{{baseUrl}}/api/loyalty/redeem`
  - Headers: `Authorization: Bearer {{token}}` (CUSTOMER only)
  - Body (JSON):
    ```json
    {
      "rewardId": "{{rewardId}}",
      "orderId": "{{orderId}}"
    }
    ```

---

### 8. Analytics Dashboard Endpoints (`/api/analytics`)
- **Get Sales Data**:
  - Method: GET
  - URL: `{{baseUrl}}/api/analytics/restaurants/{{restaurantId}}/sales`
  - Query Params: `period=day` | `week` | `month`
  - Headers: `Authorization: Bearer {{token}}`

- **Get Key Metrics**:
  - Method: GET
  - URL: `{{baseUrl}}/api/analytics/restaurants/{{restaurantId}}/metrics`
  - Headers: `Authorization: Bearer {{token}}`

- **Get Popular Items**:
  - Method: GET
  - URL: `{{baseUrl}}/api/analytics/restaurants/{{restaurantId}}/popular-items`
  - Headers: `Authorization: Bearer {{token}}`

- **Get Peak Times**:
  - Method: GET
  - URL: `{{baseUrl}}/api/analytics/restaurants/{{restaurantId}}/peak-times`
  - Headers: `Authorization: Bearer {{token}}`

---

### 9. WebSocket Connection
- **Connection URL**: `ws://localhost:5000`
- **Handshake Auth**: Send token in handshake
  ```javascript
  const io = require('socket.io-client');
  const socket = io('http://localhost:5000', {
    auth: { token: '{{token}}' }
  });
  ```
- **Listening to Notifications**:
  ```javascript
  socket.on('notification', (data) => {
    console.log('New notification:', data);
  });
  ```

---

### 10. Multi-Language Support
- Add query parameter `?lang=es` (Spanish) or `?lang=fr` (French) to any endpoint
- Or set `Accept-Language` header to `es` or `fr`
- Example URLs:
  - `{{baseUrl}}/api/restaurants?lang=fr`
  - `{{baseUrl}}/api/menu/search?lang=es&q=pizza`

---

## Explanation of Design Decisions

### 1. Loyalty Tier System
- **Tiers**: Bronze → Silver → Gold → Platinum
- **Multipliers**: 1×, 1.5×, 2×, 3× respectively
- **Why?**: Simple, progressive tier system that encourages repeat customers by offering better point earning rates

### 2. Points Expiry
- **Duration**: 30 days after earning
- **Why?**: Creates urgency to redeem points, increases customer engagement, and prevents point hoarding

### 3. WebSocket Authentication
- **Implementation**: JWT tokens in handshake auth
- **Why?**: Reuses existing authentication infrastructure, ensures secure connections, and avoids storing session data

### 4. i18n Middleware
- **Detection**: Query param first, then `Accept-Language` header, fallback to English
- **Why?**: Query param takes priority for explicit user choice, header for browser settings, fallback ensures usability

### 5. Analytics Aggregations
- **Implementation**: MongoDB aggregation pipeline
- **Why?**: Efficient computation directly at database level, avoids loading large datasets into application memory

### 6. Code Structure
- **Separation of Concerns**:
  - Controllers handle request/response
  - Services contain business logic
  - Models define data schema
- **Why?**: Makes codebase maintainable, testable, and easy to extend

---

## Challenges Faced and Solutions

### Challenge 1: Extending Express Request Type
- **Problem**: TypeScript errors when adding custom properties (like `language`, `t()`, or `user`) to Express `Request` object
- **Solution**: Initially created a declaration file, then temporarily used type casting `(req as any)` to unblock development while maintaining compatibility

### Challenge 2: i18n Fallback Logic
- **Problem**: Implementing nested key lookup with English fallback
- **Solution**: Created a helper function that splits keys by dots and traverses translation objects, falling back to English at any level

### Challenge 3: MongoDB Aggregations
- **Problem**: Structuring aggregation queries for multi‑level metrics like sales by period
- **Solution**: Leveraged MongoDB's `$group`, `$match`, and date operators (`$dateToString`) for efficient aggregation

### Challenge 4: Port Conflicts with Nodemon
- **Problem**: Port 5000 was still in use after multiple server restarts
- **Solution**: Killed zombie processes using the port before restarting the server

---

## Suggestions for Future Improvements

1. **Redis Caching**: Add Redis for caching frequent analytics queries and restaurant/menu data to reduce database load
2. **Push Notifications**: Implement push notifications using Firebase or OneSignal for order updates
3. **Enhanced Loyalty System**: Add expiring rewards, personalized offers based on order history
4. **Multilingual Menus**: Add support for translating menu items and restaurant details
5. **Notification Preferences**: Store user notification preferences (email, SMS, push) in the database
6. **Email/SMS Notifications**: Use services like Twilio or SendGrid for email and SMS notifications
7. **Data Export**: Add CSV/Excel export for analytics data
8. **Enhanced Loyalty Benefits**: Add tier‑specific perks like free delivery or priority support
9. **Unit/Integration Tests**: Write comprehensive tests for all new functionality
10. **Docker Compose Enhancement**: Add Redis and other services to docker‑compose.yml
11. **Input Validation**: Add more robust input validation using express‑validator
12. **Rate Limiting**: Implement rate limiting to prevent API abuse

---

## Database Migrations and Seed Data

### Seed Data
I've created a comprehensive seed script that creates:
- Admin, restaurant owner, customer, and delivery users
- A sample restaurant with operating hours
- Sample menu items with dietary info and customization options
- Sample loyalty rewards

### Running Seed Data
```bash
npm run seed
```

### Migrations
Currently, no migrations are needed. For future changes, we recommend using a migration tool like `mongoose-migrate` or `migrate-mongo`.

---

## Conclusion
All 6 tasks have been fully implemented according to the requirements! The codebase maintains the existing architecture, is type‑safe, and passes all linting and build checks.

