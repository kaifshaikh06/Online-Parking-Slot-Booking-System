import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";
import Message from "../components/Message";
import { getBookingEndDateTime } from "../utils/booking";
import BarChart from "../components/BarChart";

const isBookingActive = (booking, now) => {
  return booking.status === "Booked" && getBookingEndDateTime(booking) > now;
};

const UserDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([
      api.get("/slots"),
      api.get("/bookings/my"),
      api.get("/bookings/analytics/my"),
    ])
      .then(([slotResponse, bookingResponse, analyticsResponse]) => {
        const now = new Date();
        const bookings = bookingResponse.data.bookings;
        setStats({
          available: slotResponse.data.slots.filter(
            (slot) => slot.status === "Available",
          ).length,
          active: bookings.filter((booking) => isBookingActive(booking, now))
            .length,
          monthly: bookings.filter(
            (booking) =>
              booking.status === "Booked" &&
              new Date(booking.bookingDate).getMonth() === now.getMonth() &&
              new Date(booking.bookingDate).getFullYear() === now.getFullYear(),
          ).length,
        });
        setAnalytics(analyticsResponse.data);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);
  return (
    <main className="container page">
      <p className="eyebrow">Your dashboard</p>
      <h1>Welcome, {user.name}</h1>
      <p className="page-subtitle">
        Find a space, reserve it by the hour, and keep track of your parking.
      </p>
      <Message>{error}</Message>
      {!stats ? (
        <Loading />
      ) : (
        <>
          <div className="stats-grid dashboard-stats user-dashboard-stats">
            <article className="stat-card">
              <span>Available Parking Slots</span>
              <strong>{stats.available}</strong>
              <small>Choose your space on the parking map</small>
            </article>
            <article className="stat-card">
              <span>My Active Bookings</span>
              <strong>{stats.active}</strong>
              <small>Bookings you can currently manage</small>
            </article>
            <article className="stat-card">
              <span>My Bookings This Month</span>
              <strong>{stats.monthly}</strong>
              <small>Bookings scheduled this month</small>
            </article>
            <article className="stat-card">
              <span>Total Parking Spend</span>
              <strong>₹{Math.round(analytics?.totalSpend || 0).toLocaleString()}</strong>
              <small>Parking, quick services, and any overstay charges</small>
            </article>
          </div>
          <section className="dashboard-panel user-dashboard-panel">
            <div>
              <p className="eyebrow">Ready to park?</p>
              <h2>Choose from 20 marked parking spaces.</h2>
              <p>
                Each parking space shows its current availability and hourly
                booking rate.
              </p>
            </div>
            <Link className="button" to="/book-slot">
              Open Parking Map
            </Link>
          </section>
          {analytics && (
            <BarChart
              title="My Monthly Parking Cost"
              data={analytics.monthlySpend}
              valueLabel="Last 6 months"
            />
          )}
          <div className="quick-links">
            <Link to="/book-slot">Book a Slot</Link>
            <Link to="/my-bookings">My Bookings</Link>
            <Link to="/reviews">Customer Reviews</Link>
          </div>
        </>
      )}
    </main>
  );
};

export default UserDashboard;
