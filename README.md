# 💸 Expense Manager

A modern, minimal, and intuitive Expense Manager web app to track income, expenses, and spending habits in one place. Built with a clean UI, real-time insights, and a structured database design.

---

## ✨ Features

### 💳 Transaction Management
- Add income and expenses easily
- Assign categories (Food, Rent, Travel, etc.)
- Add notes and dates for each transaction

### 📊 Smart Dashboard
- View total balance (Income - Expenses)
- Monthly income vs expenses overview
- Quick summary of financial status

### 📅 Transaction History
- Filter by date range
- Filter by category
- Search transactions by notes or description

### 📈 Insights & Analytics
- Category-wise spending breakdown
- Monthly spending trends
- Highlights of top spending categories

---

## 🗄️ Database Structure

### 👤 Users
- id
- name
- email
- created_at

### 💰 Transactions
- id
- user_id (FK)
- type (income / expense)
- amount
- category
- note
- date

### 🏷️ Categories (optional)
- id
- user_id
- name
- type (income / expense)
- color

### 📊 Budgets (optional upgrade)
- id
- user_id
- category
- monthly_limit
- month

---

## 🚀 Tech Stack

- Frontend: React / Next.js (or your choice)
- Backend: Node.js / Express (or serverless)
- Database: PostgreSQL / MongoDB / Supabase
- Charts: Recharts / Chart.js
- Styling: Tailwind CSS

---

## 📦 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/expense-manager.git
cd expense-manager
