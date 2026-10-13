# Online Parking Slot Booking System

A simple MERN CRUD project for reserving parking spaces. It is designed for a BCA college demonstration: the code is separated into a React client and an Express/MongoDB server, with straightforward role-based authentication.

## Features

- User registration and JWT login
- Admin login with the same `users` collection and a `role` field
- Enhanced dashboards with availability, occupancy, and current-month booking totals
- Full parking-slot CRUD for admins
- A-01 to A-20 parking map with visible available/booked spaces and car icons
- Hourly parking rates with a booking-time cost estimate
- Car-name and vehicle-number capture for every booking
- Optional quick vehicle services at checkout, including car wash, interior cleaning, exterior polish, tyre shine, windshield care, and AC sanitisation
- Long-term parking in dedicated A-16 to A-20 spaces for 2–30 days at ₹1,000 per day, including a scheduled car wash every third day
- Automatic slot release after a booked end time passes
- Active hourly bookings can be extended; checkout after the scheduled end adds ₹1,000 per started extra hour
- User spending and admin revenue/cancellation/car-name charts
- Dummy payment confirmation before a booking is created
- Simple sequential booking IDs (`1`, `2`, `3`...) instead of MongoDB object IDs
- Booking creation, cancellation, and deletion API with slot-status synchronization
- Admin booking search by slot number or vehicle number
- Customer review page with one 1–5-star review and comment per completed booking
- Contact page with emergency contact details and a pre-filled email support form
- Dedicated responsive sidebar navigation for the admin area
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

| Area                  | Endpoint                                          | Access               |
| --------------------- | ------------------------------------------------- | -------------------- |
| Auth                  | `POST /api/auth/register`, `POST /api/auth/login` | Public               |
| Slots                 | `GET /api/slots`, `GET /api/slots/:id`            | Signed-in user/admin |
| Slots CRUD            | `POST/PUT/DELETE /api/slots...`                   | Admin only           |
| Admin stats           | `GET /api/slots/stats`                            | Admin only           |
| Bookings              | `POST /api/bookings`, `POST /api/bookings/long-term`, `GET /api/bookings/my` | Signed-in user |
| Reviews               | `GET /api/bookings/reviews`, `GET /api/bookings/review-prompt`, `POST /api/bookings/:id/review` | Public/user |
| All/search bookings   | `GET /api/bookings`, `GET /api/bookings/search`   | Admin only           |
| Booking status/delete | `PUT/DELETE /api/bookings/:id`                    | Owner or admin       |

Protected calls use `Authorization: Bearer <token>`. The server uses the user ID from the verified JWT, never an ID supplied by the booking form.

## CRUD and business rules

- Admins can create, view, edit, and delete slots.
- Users create bookings; admins can view/search them; owners can cancel them.
- Cancelling updates the booking status to `Cancelled` and changes the slot to `Available`.
- Deleting an active booking also restores the slot to `Available`.
- A slot with an active booking cannot be deleted, and the backend checks availability and active bookings before a booking is created.
- The server checks bookings every minute and automatically releases a parking slot after its booked end time passes. Booking history remains visible in My Bookings as `Ended`.
- The payment screen is a front-end demonstration only: it shows the calculated hourly amount, confirms payment, and then creates the booking. No real payment data is collected or stored.
- Before the payment confirmation, users may select or skip optional quick vehicle services. The server validates their codes and prices before saving them with the booking.
- A parking space remains unavailable to all other users until its current booking end time passes. The booking map then changes it back to Available automatically.
- When a space has a current or future reservation, an admin may correct only its slot number. Its rate, car type, location, and availability status are locked until that reservation ends.
- Long-term bookings last from 2 through 30 days. The server sets the ₹1,000 daily rate and calculates each third-day car-wash date; users can see that schedule in My Bookings.
- Only slots A-16 through A-20 may be reserved for long-term parking. Those same slots remain available for normal hourly parking whenever they are not booked.
- Once a booked parking period ends, its owner can submit one rating from 1 to 5 and one comment. Reviews are public and are also visible in the admin sidebar.
- The contact form opens the visitor's configured email app with the support address, subject, and message filled in. This app does not send email through an external provider.

## Test checklist

- Register a user and log in.
- Run the admin and slot seeds, then log in as admin and view A-01 to A-20.
- Confirm a normal user is redirected away from admin pages and receives `403` from admin APIs.
- As a user, confirm the parking map shows both available and booked spaces, then book an available slot.
- Book a slot as one user, then confirm a second user sees it as Booked and cannot select it until the booking ends.
- Confirm the hourly rate and booking-time estimate change when start/end times change.
- Use the dummy payment confirmation and verify the payment-completed message before redirection to My Bookings.
- Cancel the booking and confirm the slot is available again.
- Set a short booking time, then confirm the slot becomes available automatically after its end time (the server checks once per minute).
- Confirm the dashboard shows current-month booking totals.
- Confirm My Bookings and Admin Bookings show numeric Booking IDs instead of MongoDB object IDs.
- Create a long-term booking and confirm its total uses ₹1,000 per day and its car-wash schedule appears in My Bookings.
- Complete a booking, return to the user dashboard, submit a 1–5-star review, and confirm it appears on the Reviews page.
- As admin, search bookings by `slotNumber` and `vehicleNumber`.
- Try duplicate email, invalid login, duplicate slot number, unavailable slot booking, and an end time earlier than start time.
