# Erf AI

An advanced AI application built with Express.js, Bun.js, Bootstrap, and MongoDB.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- **Authentication & User Management**
  - JWT-based authentication
  - User profiles
  - Role-based access control (admin and user roles)

- **Advanced AI Capabilities**
  - Model training and evaluation
  - Transfer learning
  - Custom model architectures
  - Model versioning

- **Dataset Management**
  - Upload and manage datasets
  - Dataset versioning
  - Data preprocessing
  - Dataset sharing

- **API**
  - RESTful API with Swagger documentation
  - Rate limiting
  - Secure endpoints

## Technology Stack

- **Backend**: Express.js, Bun.js
- **Frontend**: HTML, CSS, JavaScript, Bootstrap
- **Database**: MongoDB
- **AI**: TensorFlow.js
- **Authentication**: JWT

## Prerequisites

- [Bun](https://bun.sh/) v1.x or higher
- [MongoDB](https://www.mongodb.com/) v6.x or higher
- [Node.js](https://nodejs.org/) v18.x or higher (for some dependencies)

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/VersatileFusion/Erf-AI.git
cd Erf-AI
```

2. **Install dependencies**

```bash
bun install
```

3. **Environment setup**

Create a `.env` file in the project root with the following variables:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/erf-ai
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=7d
```

4. **Database setup**

Make sure MongoDB is running:

```bash
# Start MongoDB
mongod --dbpath=/path/to/data/db
```

5. **Starting the application**

```bash
# Development mode
bun dev

# Production mode
bun start
```

The application will be accessible at `http://localhost:3000`.

## API Documentation

Once the server is running, you can access the Swagger API documentation at:

```
http://localhost:3000/api-docs
```

## Project Structure

```
.
├── models/             # MongoDB models
├── datasets/           # Dataset storage 
├── public/             # Static assets
├── src/
│   ├── controllers/    # Request handlers
│   ├── db/             # Database configuration
│   ├── middlewares/    # Express middlewares
│   ├── models/         # Data models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── index.js        # Application entry point
├── .env                # Environment variables
├── .gitignore          # Git ignore file
├── package.json        # Project metadata and dependencies
└── README.md           # Project documentation
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/preferences` - Update user preferences
- `PUT /api/auth/change-password` - Change user password

### AI Models

- `POST /api/ai/initialize` - Initialize a new model
- `POST /api/ai/train` - Train a model
- `POST /api/ai/predict` - Make predictions
- `POST /api/ai/save` - Save trained model
- `GET /api/ai/models` - Get all models
- `GET /api/ai/models/:modelId` - Get model details
- `GET /api/ai/public-models` - Get public models for transfer learning
- `POST /api/ai/clone` - Clone model for transfer learning
- `PUT /api/ai/architecture` - Update model architecture
- `PUT /api/ai/hyperparameters` - Update model hyperparameters
- `POST /api/ai/visualization` - Add visualization
- `POST /api/ai/version` - Create model version
- `PUT /api/ai/visibility` - Toggle model visibility

### Datasets

- `POST /api/datasets` - Create a new dataset
- `GET /api/datasets` - Get all accessible datasets
- `GET /api/datasets/:id` - Get a specific dataset
- `PUT /api/datasets/:id` - Update a dataset
- `POST /api/datasets/:id/share` - Share a dataset
- `DELETE /api/datasets/:id` - Delete a dataset
- `POST /api/datasets/:id/preprocessing` - Add preprocessing step
- `POST /api/datasets/:id/versions` - Add dataset version
- `PUT /api/datasets/:id/statistics` - Update dataset statistics
- `PUT /api/datasets/:id/metadata` - Update dataset metadata

## License

MIT

## Author

Erfan Ahmadvand

---

<div dir="rtl">

# ارف ای‌آی (Erf AI)

یک برنامه پیشرفته هوش مصنوعی ساخته شده با Express.js، Bun.js، Bootstrap و MongoDB.

[![مجوز: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## ویژگی‌ها

- **احراز هویت و مدیریت کاربران**
  - احراز هویت مبتنی بر JWT
  - پروفایل‌های کاربری
  - کنترل دسترسی بر اساس نقش (نقش‌های مدیر و کاربر)

- **قابلیت‌های پیشرفته هوش مصنوعی**
  - آموزش و ارزیابی مدل
  - یادگیری انتقالی (Transfer Learning)
  - معماری‌های سفارشی مدل
  - نسخه‌بندی مدل

- **مدیریت مجموعه داده**
  - آپلود و مدیریت مجموعه داده‌ها
  - نسخه‌بندی مجموعه داده
  - پیش‌پردازش داده
  - اشتراک‌گذاری مجموعه داده

- **API**
  - API مبتنی بر REST با مستندات Swagger
  - محدودیت نرخ درخواست
  - نقاط پایانی امن

## فناوری‌های استفاده شده

- **بک‌اند**: Express.js، Bun.js
- **فرانت‌اند**: HTML، CSS، JavaScript، Bootstrap
- **پایگاه داده**: MongoDB
- **هوش مصنوعی**: TensorFlow.js
- **احراز هویت**: JWT

## پیش‌نیازها

- [Bun](https://bun.sh/) نسخه ۱ یا بالاتر
- [MongoDB](https://www.mongodb.com/) نسخه ۶ یا بالاتر
- [Node.js](https://nodejs.org/) نسخه ۱۸ یا بالاتر (برای برخی وابستگی‌ها)

## نصب و راه‌اندازی

۱. **کلون کردن مخزن**

```bash
git clone https://github.com/VersatileFusion/Erf-AI.git
cd Erf-AI
```

۲. **نصب وابستگی‌ها**

```bash
bun install
```

۳. **تنظیم محیط**

یک فایل `.env` در پوشه اصلی پروژه با متغیرهای زیر ایجاد کنید:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/erf-ai
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=7d
```

۴. **راه‌اندازی پایگاه داده**

مطمئن شوید که MongoDB در حال اجراست:

```bash
# شروع MongoDB
mongod --dbpath=/path/to/data/db
```

۵. **شروع برنامه**

```bash
# حالت توسعه
bun dev

# حالت تولید
bun start
```

برنامه در آدرس `http://localhost:3000` قابل دسترسی خواهد بود.

## مستندات API

پس از راه‌اندازی سرور، می‌توانید به مستندات Swagger API در آدرس زیر دسترسی پیدا کنید:

```
http://localhost:3000/api-docs
```

## ساختار پروژه

```
.
├── models/             # مدل‌های MongoDB
├── datasets/           # ذخیره مجموعه داده‌ها
├── public/             # فایل‌های استاتیک
├── src/
│   ├── controllers/    # کنترلرهای درخواست
│   ├── db/             # پیکربندی پایگاه داده
│   ├── middlewares/    # میدلورهای Express
│   ├── models/         # مدل‌های داده
│   ├── routes/         # مسیرهای API
│   ├── services/       # منطق کسب و کار
│   ├── utils/          # توابع کمکی
│   └── index.js        # نقطه ورود برنامه
├── .env                # متغیرهای محیطی
├── .gitignore          # فایل نادیده گرفتن Git
├── package.json        # متادیتا و وابستگی‌های پروژه
└── README.md           # مستندات پروژه
```

## نقاط پایانی API

### احراز هویت

- `POST /api/auth/register` - ثبت‌نام کاربر جدید
- `POST /api/auth/login` - ورود کاربر
- `GET /api/auth/profile` - دریافت پروفایل کاربر
- `PUT /api/auth/profile` - به‌روزرسانی پروفایل کاربر
- `PUT /api/auth/preferences` - به‌روزرسانی تنظیمات کاربر
- `PUT /api/auth/change-password` - تغییر رمز عبور کاربر

### مدل‌های هوش مصنوعی

- `POST /api/ai/initialize` - راه‌اندازی مدل جدید
- `POST /api/ai/train` - آموزش مدل
- `POST /api/ai/predict` - انجام پیش‌بینی
- `POST /api/ai/save` - ذخیره مدل آموزش‌دیده
- `GET /api/ai/models` - دریافت همه مدل‌ها
- `GET /api/ai/models/:modelId` - دریافت جزئیات مدل
- `GET /api/ai/public-models` - دریافت مدل‌های عمومی برای یادگیری انتقالی
- `POST /api/ai/clone` - کلون کردن مدل برای یادگیری انتقالی
- `PUT /api/ai/architecture` - به‌روزرسانی معماری مدل
- `PUT /api/ai/hyperparameters` - به‌روزرسانی هایپرپارامترهای مدل
- `POST /api/ai/visualization` - افزودن ویژوالایزیشن
- `POST /api/ai/version` - ایجاد نسخه جدید مدل
- `PUT /api/ai/visibility` - تغییر وضعیت نمایش مدل

### مجموعه داده‌ها

- `POST /api/datasets` - ایجاد مجموعه داده جدید
- `GET /api/datasets` - دریافت همه مجموعه داده‌های قابل دسترسی
- `GET /api/datasets/:id` - دریافت یک مجموعه داده خاص
- `PUT /api/datasets/:id` - به‌روزرسانی مجموعه داده
- `POST /api/datasets/:id/share` - اشتراک‌گذاری مجموعه داده
- `DELETE /api/datasets/:id` - حذف مجموعه داده
- `POST /api/datasets/:id/preprocessing` - افزودن مرحله پیش‌پردازش
- `POST /api/datasets/:id/versions` - افزودن نسخه جدید مجموعه داده
- `PUT /api/datasets/:id/statistics` - به‌روزرسانی آمارهای مجموعه داده
- `PUT /api/datasets/:id/metadata` - به‌روزرسانی متادیتای مجموعه داده

## مجوز

MIT

## نویسنده

عرفان احمدوند

</div>
