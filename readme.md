# 🛒 ShopWise Backend (Node.js + Express + MongoDB)

**ShopWise Backend** is a full-featured e-commerce API built using **Node.js**, **Express**, and **MongoDB**.  
It includes authentication, product management, cart & wishlist, order processing, and test automation — following a clean modular architecture.

---

## 🚀 Features

| Module | Description |
|:-------|:-------------|
| 🔐 **Auth** | User Signup & Login with JWT authentication |
| 📦 **Products** | CRUD operations, search, filters, pagination, image upload (Multer) |
| 🛍️ **Cart & Wishlist** | Add/remove items, move between cart & wishlist |
| 💳 **Orders** | Checkout flow, order creation, payment mock, stock deduction |
| 🧪 **Testing** | Jest + Supertest integration tests |
| ⚙️ **CI/CD** | GitHub Actions workflow for automated test runs |
| 📁 **Modular Structure** | Controllers, Models, Routes, and Middlewares are cleanly separated |

---

## 🧩 Tech Stack

- **Runtime:** Node.js (Express)
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT (JSON Web Token)
- **Validation:** Joi
- **Testing:** Jest, Supertest, mongodb-memory-server
- **File Uploads:** Multer (local), ready for S3 integration
- **Version Control:** Git + GitHub PR Workflow
- **Environment:** dotenv
- **Deployment Ready:** Render / Railway / Docker

---

## 🧱 Folder Structure

   src/
├─ config/ # DB connection
├─ models/ # Mongoose models (User, Product, Cart, Wishlist, Order)
├─ controllers/ # Business logic per module
├─ routes/ # API endpoints
├─ middlewares/ # Auth, upload, error handlers
├─ utils/ # Pagination, helpers
└─ app.js # Express app entry


---

## ⚙️ Setup & Installation

### 1️⃣ Clone the repository
```bash
git clone https://github.com/adarshkumarhembram/Shopwise-Backend.git
cd Shopwise-Backend
2️⃣ Install dependencies
npm install

3️⃣ Setup environment variables

Create a .env file (you can copy from example):

cp .env.example .env


Example .env content:

PORT=4000
MONGO_URI=mongodb://localhost:27017/shopwise
JWT_SECRET=supersecret

4️⃣ Run in development mode
npm run dev

5️⃣ Run tests
npm test

🧪 API Endpoints Overview
🔐 Auth
Method	Endpoint	Description
POST	/api/auth/signup	Register a new user
POST	/api/auth/login	Login and get JWT
📦 Products
Method	Endpoint	Description
POST	/api/products	Create a new product
GET	/api/products	Get all products (filters, search, pagination)
GET	/api/products/:id	Get single product
PUT	/api/products/:id	Update product
DELETE	/api/products/:id	Delete product
🛍️ Cart & Wishlist
Method	Endpoint	Description
GET	/api/cart	View user cart
POST	/api/cart/add	Add item to cart
PUT	/api/cart/item/:id	Update cart item quantity
DELETE	/api/cart/item/:id	Remove from cart
POST	/api/cart/clear	Clear cart
GET	/api/wishlist	View wishlist
POST	/api/wishlist/add	Add product to wishlist
POST	/api/wishlist/move-to-cart	Move wishlist item to cart
💳 Orders
Method	Endpoint	Description
POST	/api/orders/checkout	Create new order (checkout)
GET	/api/orders/me	View my orders
GET	/api/orders/:id	Get order by ID
GET	/api/orders	(Admin) View all orders
PUT	/api/orders/:id/status	(Admin) Update order status
🧾 Example Request (Checkout)
curl -X POST http://localhost:4000/api/orders/checkout \
 -H "Authorization: Bearer <JWT_TOKEN>" \
 -H "Content-Type: application/json" \
 -d '{
   "shippingAddress": {
     "name": "John Doe",
     "addressLine1": "123 Street",
     "city": "Ranchi",
     "state": "Jharkhand",
     "postalCode": "834001",
     "country": "India",
     "phone": "9876543210"
   }
 }'

🧪 Testing

Run full test suite:

npm test


Uses:

mongodb-memory-server → In-memory Mongo instance

Supertest → HTTP request testing

Jest → Test runner

🧠 Git Workflow Used

Each module built using a separate branch:

feature/auth
feature/products-crud
feature/cart-wishlist
feature/orders


Merged to main via Pull Requests:

Clean commits (feat, test, chore, ci)

Each PR tagged: v1.0-auth, v1.2-products, v1.3-cart-wishlist, v1.4-orders

This gives a real-industry workflow impression.

🚀 Future Enhancements

🧾 Order history with filtering & search

💳 Real payment gateway (Stripe / Razorpay)

📬 Email notifications on order events

👨‍💼 Admin analytics & reports

☁️ Cloud file storage (AWS S3)

🐳 Docker & Render deployment setup

📜 License

MIT License © 2025 Adarsh Kumar Hembram

🌟 Show Your Support

If you liked this project, please ⭐ the repo and share it!
Let’s connect on LinkedIn
 for developer collaborations 🤝


---

### ✅ Next Steps
1. Save this as `README.md` in your project root.  
2. Run:
   ```bash
   git add README.md
   git commit -m "docs: added complete project README"
   git push origin main
