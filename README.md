# ShopVerse E-commerce API

A full-featured, production-ready e-commerce REST API backend built with Node.js, Express, PostgreSQL, and Sequelize ORM.

## 🚀 Features

- **Authentication & Authorization**

  - JWT-based authentication
  - Role-based access control (admin & customer)
  - Password hashing with bcrypt

- **User Management**

  - User registration and login
  - Profile management
  - Admin user management

- **Product Management**

  - CRUD operations for products
  - Product categorization
  - Image support (URLs)
  - Stock management
  - Product search and filtering

- **Shopping Cart**

  - Add/remove items
  - Update quantities
  - Cart persistence

- **Order Management**

  - Checkout process
  - Order history
  - Order status tracking
  - Admin order management

- **Reviews & Ratings**

  - Product reviews and ratings
  - Average rating calculation
  - Review moderation

- **Product Likes**

  - Like/unlike products
  - User favorites

- **Advanced Features**
  - Pagination
  - Search and filtering
  - Input validation
  - Error handling
  - Rate limiting
  - Security middleware

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT + bcrypt
- **Validation**: express-validator
- **Security**: helmet, cors, rate-limiting

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd shopverse-api
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` file with your configuration:

   ```env
   PORT=3000
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=shopverse_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d
   ```

4. **Database Setup**

   ```bash
   # Create PostgreSQL database
   createdb shopverse_db

   # Run migrations (if using Sequelize CLI)
   npm run db:migrate

   # Or sync database (development only)
   npm run dev
   ```

5. **Start the server**

   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user profile
- `POST /auth/logout` - Logout user

#### Users

- `GET /users` - Get all users (admin only)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user profile
- `DELETE /users/:id` - Delete user (admin only)

#### Products

- `GET /products` - Get all products (with pagination & filtering)
- `GET /products/:id` - Get product by ID
- `POST /products` - Create new product (admin only)
- `PUT /products/:id` - Update product (admin only)
- `DELETE /products/:id` - Delete product (admin only)

#### Categories

- `GET /categories` - Get all categories
- `GET /categories/:id` - Get category by ID with products
- `POST /categories` - Create new category (admin only)
- `PUT /categories/:id` - Update category (admin only)
- `DELETE /categories/:id` - Delete category (admin only)

#### Cart

- `GET /cart` - Get user's cart
- `POST /cart/items` - Add item to cart
- `PUT /cart/items/:id` - Update cart item quantity
- `DELETE /cart/items/:id` - Remove item from cart
- `DELETE /cart` - Clear cart

#### Orders

- `GET /orders` - Get user orders or all orders (admin)
- `GET /orders/:id` - Get order by ID
- `POST /orders` - Create new order (checkout)
- `PUT /orders/:id/status` - Update order status (admin only)

#### Likes

- `GET /likes` - Get user's liked products
- `POST /likes/:productId` - Like a product
- `DELETE /likes/:productId` - Unlike a product
- `GET /likes/check/:productId` - Check if user liked a product

#### Comments

- `GET /comments/products/:productId` - Get product comments
- `POST /comments/products/:productId` - Add comment to product
- `PUT /comments/:id` - Update comment
- `DELETE /comments/:id` - Delete comment
- `GET /comments/my` - Get user's comments

## 🔧 API Examples

### Register a new user

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Create a product (admin only)

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "name": "iPhone 15 Pro",
    "description": "Latest iPhone with advanced features",
    "price": 999.99,
    "stock": 50,
    "categoryId": 1,
    "images": ["https://example.com/iphone1.jpg", "https://example.com/iphone2.jpg"]
  }'
```

### Get products with filtering

```bash
curl "http://localhost:3000/api/products?page=1&limit=10&search=iphone&categoryId=1&minPrice=500&maxPrice=1000"
```

### Add item to cart

```bash
curl -X POST http://localhost:3000/api/cart/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "productId": 1,
    "quantity": 2
  }'
```

### Create an order (checkout)

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "shippingAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "billingAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "paymentMethod": "credit_card"
  }'
```

## 🗄 Database Schema

### Users

- id, firstName, lastName, email, password, role, phone, address, isActive, lastLogin

### Categories

- id, name, description, slug, imageUrl, isActive

### Products

- id, name, description, price, stock, images, categoryId, sku, slug, isActive, isFeatured, weight, dimensions, averageRating, reviewCount

### Orders

- id, userId, orderNumber, status, totalAmount, subtotal, taxAmount, shippingAmount, discountAmount, shippingAddress, billingAddress, paymentMethod, paymentStatus, notes, estimatedDelivery, shippedAt, deliveredAt

### OrderItems

- id, orderId, productId, quantity, unitPrice, totalPrice, productSnapshot

### Cart

- id, userId, isActive, expiresAt

### CartItems

- id, cartId, productId, quantity, addedAt

### Likes

- id, userId, productId, createdAt

### Comments

- id, userId, productId, content, rating, isApproved, isEdited, editedAt

## 🔒 Security Features

- JWT authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet security headers
- SQL injection prevention (Sequelize)

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📦 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:reset` - Reset database (drop, create, migrate, seed)

## 🚀 Deployment

1. Set environment variables for production
2. Build the application
3. Set up PostgreSQL database
4. Run migrations
5. Start the server
