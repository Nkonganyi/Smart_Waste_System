# Smart Waste System

A full-stack web application developed as my final-year project to improve waste collection through digital reporting, scheduling, and route optimization.

## Features
- **User Roles**: Citizen, Collector, and Admin dashboards.
- **Waste Reporting**: Citizens can report waste with images and location.
- **Logistics Optimization**: Automatic route optimization for collectors using OpenRouteService.
- **Real-time Analytics**: Admin dashboard with statistics and maps.
- **Verification System**: Email verification for all new accounts.

## Tech Stack
- **Frontend**: React, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT & Role-Based Access Control (RBAC)
- **External APIs**: OpenCage (Geocoding), OpenRouteService (Logistics)

## Getting Started

### Prerequisites
- Node.js (v14+)
- Supabase Account
- OpenCage API Key
- OpenRouteService API Key

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env` (see `.env.example`)
4. Start the server:
   ```bash
   npm start
   ```

## API Documentation

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT
- `GET /api/auth/verify-email` - Verify email via token

### Reports
- `POST /api/reports` - Create a new waste report (Authenticated)
- `GET /api/reports/my` - Get reports created by the user
- `GET /api/reports/assigned` - Get reports assigned to a collector

### Admin
- `GET /api/dashboard/admin` - Get system-wide statistics
- `POST /api/reports/assign` - Assign a collector to a report

## Testing
Run tests using:
```bash
npm test
```
## Future Improvements

- Google Maps Integration
- Mobile Application
- Real-time Notifications

## Author

Nkonganyi Blec Ketu
