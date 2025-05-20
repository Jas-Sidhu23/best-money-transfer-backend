# Best Money Transfer Partner (BMTP) – Backend

This is the backend server for **Best Money Transfer Partner (BMTP)**, an in-progress peer-to-peer money transfer mobile application. The backend is built using **Node.js**, **Express**, **MySQL**, and **JWT** for secure user authentication. It powers functionality such as user registration, login, wallet-to-wallet transfers, and account customization.

## 🔧 Technologies Used

- Node.js
- Express.js
- MySQL
- JWT (JSON Web Tokens)
- Multer (for image uploads)

## 📁 Project Structure

new_money_transfer/

├── controller.js # Core business logic and main database query handling

├── routes.js # API route definitions

├── index.js # Entry point to start the server

├── connection.js # MySQL database connection setup

├── middlewares/ # Custom Express middlewares

├── helpers/ # Utility functions

├── uploads/ # Uploaded profile pictures

├── .env # Environment variables (excluded from version control)

├── package.json # Project dependencies and scripts

> The main logic for handling user operations and database queries is centralized in `controller.js`. This file contains the core business rules for user authentication, transactions, and profile operations.

