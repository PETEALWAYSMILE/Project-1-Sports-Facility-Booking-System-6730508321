# Sports Facility Booking System API

A RESTful backend API for managing sports facilities and bookings. It supports user authentication, role-based access control, facility administration, and member bookings.

## Features

### Authentication and Users

- Register and log in with email and password
- Password hashing with bcryptjs
- JWT bearer-token authentication via the Authorization header only; login still sets an HTTP-only cookie, which is not used for authentication
- Roles: `admin` and `member`
- Protected routes and role-based authorization

### Sports Facilities

- Public facility listing and detail endpoints
- Admin-only create, update, and delete operations
- Facility data includes name, sport type, location, capacity, hourly rate, and active status

### Bookings

- Members can create bookings for facilities
- Members can view, update, and delete their own bookings
- Admins can view, update, and delete any booking
- Bookings include facility, date, start time, duration, and user references

### Booking Rules

- Booking dates cannot be in the past
- A booking can last at most 2 hours
- A member cannot create overlapping bookings
- A facility cannot be booked by multiple users during the same time period

### Security and Documentation

- Helmet security headers
- CORS support
- Request rate limiting
- HTTP parameter pollution protection
- Swagger/OpenAPI documentation at `/api-docs`
- Health check at `/health`

## Technology Stack

- Node.js and Express.js
- MongoDB with Mongoose ODM
- JWT and bcryptjs
- Swagger UI and OpenAPI
- Nodemon for development

## Project Structure

```text
config/          Environment and database configuration
controllers/     Request handlers
middleware/      Authentication and authorization middleware
models/          Mongoose schemas
routes/          Express API routes
server.js        Application entry point
```

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set `MONGO_URI` and a strong `JWT_SECRET` in `config/config.env`.

3. Start the development server:

   ```bash
   npm run dev
   ```

The API runs on `http://localhost:5000` by default.

## API Routes

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/logout`
- `GET /api/v1/facilities`
- `GET /api/v1/facilities/:id`
- `POST /api/v1/facilities` (admin)
- `PUT /api/v1/facilities/:id` (admin)
- `DELETE /api/v1/facilities/:id` (admin)
- `GET /api/v1/bookings` (member or admin)
- `GET /api/v1/bookings/:id` (member or admin)
- `POST /api/v1/bookings` (member)
- `PUT /api/v1/bookings/:id` (member owner or admin)
- `DELETE /api/v1/bookings/:id` (member owner or admin)
