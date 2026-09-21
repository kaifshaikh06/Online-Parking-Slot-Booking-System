# Online Parking Slot Booking System

A simple MERN CRUD project for reserving parking spaces. It is designed for a BCA college demonstration: the code is separated into a React client and an Express/MongoDB server, with straightforward role-based authentication.

## Features

- User registration and JWT login
- Admin login with the same `users` collection and a `role` field
- Admin dashboard: total, available, and booked slots; total bookings
- Full parking-slot CRUD for admins
- Booking creation, cancellation, and deletion API with slot-status synchronization
- Admin booking search by slot number or vehicle number
- User dashboard, available-slot view, My Bookings, and editable profile
- Responsive forms, tables, messages, loading states, and confirmation prompts

## Technology stack

- Frontend: React, JavaScript, React Router, Axios, HTML/CSS
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Security: JWT and bcryptjs

## Roles and data

There are exactly two roles: `user` and `admin`.

MongoDB uses only these three application collections:

1. `users` — name, email, hashed password, phone, role
2. `parking_slots` — slot number, location, vehicle type, status, price
3. `bookings` — user reference, parking slot reference, vehicle number, time, status

## Installation

Prerequisites: Node.js (18+ recommended) and a running MongoDB server or MongoDB Atlas database.

1. In `server`, copy `.env.example` to `.env` and set `MONGO_URI` and `JWT_SECRET`.
2. In `client`, optionally copy `.env.example` to `.env`. The default API address is `http://localhost:5000/api`.
3. Install the two applications separately.

```bash
cd server
npm install
npm run dev
```

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Vite will print the local frontend URL (normally `http://localhost:5173`).

## MongoDB configuration

For a local database, the supplied server environment example is enough:

```env
MONGO_URI=mongodb://127.0.0.1:27017/parking_booking
```

For Atlas, replace it with the Atlas connection string. Never commit the real `.env` file or credentials.

## Seed the first admin

After configuring `server/.env` and installing server dependencies, run:

```bash
cd server
npm run seed:admin
```

It creates or verifies this account:

```text
Email: admin@example.com
Password: Admin@123
Role: admin
```

This password is only a development seed value and must be changed for a real deployment.

## API overview

| Area | Endpoint | Access |
| --- | --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login` | Public |
| Profile | `GET/PUT /api/users/profile` | Signed-in user |
| Slots | `GET /api/slots`, `GET /api/slots/:id` | Signed-in user/admin |
| Slots CRUD | `POST/PUT/DELETE /api/slots...` | Admin only |
| Admin stats | `GET /api/slots/stats` | Admin only |
| Bookings | `POST /api/bookings`, `GET /api/bookings/my` | Signed-in user |
| All/search bookings | `GET /api/bookings`, `GET /api/bookings/search` | Admin only |
| Booking status/delete | `PUT/DELETE /api/bookings/:id` | Owner or admin |

Protected calls use `Authorization: Bearer <token>`. The server uses the user ID from the verified JWT, never an ID supplied by the booking form.

## CRUD and business rules

- Admins can create, view, edit, and delete slots.
- Users create bookings; admins can view/search them; owners can cancel them.
- Cancelling updates the booking status to `Cancelled` and changes the slot to `Available`.
- Deleting an active booking also restores the slot to `Available`.
- A slot with an active booking cannot be deleted, and the backend checks availability and active bookings before a booking is created.

## Test checklist

- Register a user, log in, and update their profile.
- Run the admin seed, log in as admin, create/edit/delete an unused slot.
- Confirm a normal user is redirected away from admin pages and receives `403` from admin APIs.
- As a user, book an available slot and confirm it disappears from Book Slot.
- Cancel the booking and confirm the slot is available again.
- As admin, search bookings by `slotNumber` and `vehicleNumber`.
- Try duplicate email, invalid login, duplicate slot number, unavailable slot booking, and an end time earlier than start time.
