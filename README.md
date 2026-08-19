# FoamWalay

> Desktop business management software built for Al Harmain Foam Center.

FoamWalay is a desktop business management application for managing products, inventory, sales, financial reporting, and business settings for a foam and mattress retail business.

## Features

- Admin authentication
- Product management
- Inventory tracking
- Sales management
- Dashboard analytics
- Sales and inventory reports
- Revenue and gross-profit calculations
- Low-stock monitoring
- Business settings
- Database backup and restore
- Windows desktop application
- Local MongoDB database

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- Zustand
- Axios
- React Router

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcryptjs

### Desktop

- Electron
- electron-builder

### Testing

- Vitest
- Supertest

## Architecture

FoamWalay Desktop
        |
        v
React + Vite + Tailwind
        |
        v
Express + Node.js
        |
        v
MongoDB

## Requirements

- Node.js
- npm
- MongoDB Community Server

## Development

Clone the repository:

git clone https://github.com/m-zaki-237/FoamWalay-Software.git
cd FoamWalay-Software

Install dependencies:

npm install
cd client
npm install
cd ..

Start the development environment:

npm run dev

Start the Electron desktop application:

npm run dev:desktop

## Testing

npm test

## Production Build

Build the frontend:

npm run build

Build the Windows installer:

npm run dist

The generated installer will be available in the dist/ directory.

## Database

FoamWalay uses MongoDB locally.

Default connection:

mongodb://127.0.0.1:27017/foamwalay

A custom MongoDB connection can be provided through the MONGODB_URI environment variable.

Do not commit .env files, credentials, or other sensitive information.

## Project Structure

FoamWalay-Software/
├── client/          # React frontend
├── server/          # Express backend
├── electron/        # Electron desktop runtime
├── tests/           # Automated tests
├── scripts/         # Development utilities
├── assets/          # Application assets
├── package.json
└── README.md

## License

FoamWalay is proprietary software.

Copyright © 2026 Muhammad Zakria. All rights reserved.

See the LICENSE file for the full terms.

## Author

Muhammad Zakria (Zaki)

Built for Al Harmain Foam Center.
