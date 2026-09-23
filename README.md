# Online Parking Slot Booking System

A simple MERN CRUD project for reserving parking spaces. It is designed for a BCA college demonstration: the code is separated into a React client and an Express/MongoDB server, with straightforward role-based authentication.

## Features

- User registration and JWT login
- Admin login with the same `users` collection and a `role` field
- Enhanced dashboards with availability, occupancy, and current-month booking totals
- Full parking-slot CRUD for admins
- A-01 to A-20 parking map with visible available/booked spaces, car icons, and booked-until times
- Hourly parking rates with a booking-time cost estimate
- Automatic slot release after a booked end time passes
- Dummy payment confirmation before a booking is created
- Multiple non-overlapping bookings for the same space on the same date
- Simple sequential booking IDs (`1`, `2`, `3`...) instead of MongoDB object IDs
- Booking creation, cancellation, and deletion API with slot-status synchronization
- Admin booking search by slot number or vehicle number
- User dashboard, available-slot view, and My Bookings
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
2. `parking_slots` — A-01 to A-20 slot number, Level A location, car type, status, hourly rate
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

## Seed the 20 parking spaces

Create the default car parking map after configuring `server/.env`:

```bash
cd server
npm run seed:slots
```

This safely adds any missing spaces from `A-01` through `A-20`. It preserves existing slot rates and booking statuses; each new slot starts with a default hourly rate of `₹50`.

All parking spaces use `Level A`. The available vehicle types are Sedan, SUV, Coupe, Muscle, Hatchback, and Convertible. On server start, legacy location/type values are normalized to Level A and Sedan where needed.

## API overview

| Area | Endpoint | Access |
| --- | --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login` | Public |
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
- The server checks bookings every minute and automatically releases a parking slot after its booked end time passes. Booking history remains visible in My Bookings as `Ended`.
- The payment screen is a front-end demonstration only: it shows the calculated hourly amount, confirms payment, and then creates the booking. No real payment data is collected or stored.
- A parking space can have several bookings on the same day when their hours do not overlap. The booking map shows the reserved period and marks a conflicting selected period as booked until its end time.
- When a space has a current or future reservation, an admin may correct only its slot number. Its rate, car type, location, and availability status are locked until that reservation ends.

## Test checklist

- Register a user and log in.
- Run the admin and slot seeds, then log in as admin and view A-01 to A-20.
- Confirm a normal user is redirected away from admin pages and receives `403` from admin APIs.
- As a user, confirm the parking map shows both available and booked spaces, then book an available slot.
- Make a second non-overlapping booking for the same slot and date; then try an overlapping time range and confirm it shows the booked-until time.
- Confirm the hourly rate and booking-time estimate change when start/end times change.
- Use the dummy payment confirmation and verify the payment-completed message before redirection to My Bookings.
- Cancel the booking and confirm the slot is available again.
- Set a short booking time, then confirm the slot becomes available automatically after its end time (the server checks once per minute).
- Confirm the dashboard shows current-month booking totals.
- Confirm My Bookings and Admin Bookings show numeric Booking IDs instead of MongoDB object IDs.
- As admin, search bookings by `slotNumber` and `vehicleNumber`.
- Try duplicate email, invalid login, duplicate slot number, unavailable slot booking, and an end time earlier than start time.
