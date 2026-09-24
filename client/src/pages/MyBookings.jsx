import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../services/api";
import Loading from "../components/Loading";
import Message from "../components/Message";
import StatusBadge from "../components/StatusBadge";

const date = (value) => (value ? new Date(value).toLocaleDateString() : "—");
const hasBookingEnded = (booking) => {
  const bookingDay = new Date(booking.bookingDate).toISOString().slice(0, 10);
  return new Date(`${bookingDay}T${booking.endTime}:00`) <= new Date();
};
const MyBookings = () => {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const loadBookings = () =>
    api
      .get("/bookings/my")
      .then(({ data }) => setBookings(data.bookings))
      .catch((err) => setError(getErrorMessage(err)));
  useEffect(() => {
    loadBookings();
  }, []);
  const cancel = async (booking) => {
    if (
      !window.confirm(
        `Cancel booking for slot ${booking.parkingSlot?.slotNumber || ""}?`,
      )
    )
      return;
    setError("");
    setSuccess("");
    try {
      const { data } = await api.put(`/bookings/${booking._id}`, {
        status: "Cancelled",
      });
      setSuccess(data.message);
      loadBookings();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };
  return (
    <main className="container page">
      <p className="eyebrow">Your reservations</p>
      <h1>My Bookings</h1>
      <Message>{error}</Message>
      <Message type="success">{success}</Message>
      {!bookings ? (
        <Loading />
      ) : bookings.length === 0 ? (
        <p className="empty-state">
          No bookings found. Choose an available parking slot to get started.
        </p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Slot Number</th>
                <th>Vehicle Number</th>
                <th>Booking Date</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const ended =
                  booking.status === "Booked" && hasBookingEnded(booking);
                return (
                  <tr key={booking._id}>
                    <td className="id-cell">{booking.bookingNumber || "—"}</td>
                    <td>{booking.parkingSlot?.slotNumber || "Deleted slot"}</td>
                    <td>{booking.vehicleNumber}</td>
                    <td>{date(booking.bookingDate)}</td>
                    <td>{booking.startTime}</td>
                    <td>{booking.endTime}</td>
                    <td>
                      <StatusBadge status={ended ? "Ended" : booking.status} />
                    </td>
                    <td>
                      {booking.status === "Booked" && !ended && (
                        <button
                          className="button button-small button-danger"
                          onClick={() => cancel(booking)}
                        >
                          Cancel Booking
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
};

export default MyBookings;
