import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../services/api";
import Loading from "../components/Loading";
import Message from "../components/Message";
import StatusBadge from "../components/StatusBadge";
import {
  formatDate,
  getBookingEndDateTime,
  hasBookingEnded,
} from "../utils/booking";

const getAddOnLabel = (booking) => {
  if (!booking.addOns?.length) return "No services";
  return booking.addOns.map((addOn) => addOn.name).join(", ");
};

const getBookingTotal = (booking) =>
  Number(booking.parkingTotal || 0) +
  Number(booking.addOnTotal || 0) +
  Number(booking.overstayCharge || 0);

const MyBookings = () => {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadBookings = () =>
    api
      .get("/bookings/my")
      .then(({ data }) => setBookings(data.bookings))
      .catch((requestError) => setError(getErrorMessage(requestError)));

  useEffect(() => {
    loadBookings();
  }, []);

  const cancel = async (booking) => {
    if (
      !window.confirm(
        `Cancel booking for slot ${booking.parkingSlot?.slotNumber || ""}?`,
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");
    try {
      const { data } = await api.put(`/bookings/${booking._id}`, {
        status: "Cancelled",
      });
      setSuccess(data.message);
      loadBookings();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const extend = async (booking) => {
    const endTime = window.prompt(
      "Enter your new end time (24-hour format, for example 18:30):",
      booking.endTime,
    );
    if (!endTime) return;

    setError("");
    setSuccess("");
    try {
      const { data } = await api.post(`/bookings/${booking._id}/extend`, {
        endTime,
      });
      setSuccess(`${data.message} Extra parking charge: ₹${data.extraCharge.toFixed(2)}.`);
      loadBookings();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const checkout = async (booking) => {
    if (!window.confirm("Confirm that your vehicle has exited the parking slot?")) {
      return;
    }

    setError("");
    setSuccess("");
    try {
      const { data } = await api.post(`/bookings/${booking._id}/checkout`);
      setSuccess(data.message);
      loadBookings();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
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
                <th>Parking Type</th>
                <th>Car Name</th>
                <th>Vehicle Number</th>
                <th>Booking Date</th>
                <th>Duration / Start</th>
                <th>Ends</th>
                <th>Quick Services</th>
                <th>Total Cost</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const ended = hasBookingEnded(booking);
                const isLongTerm = booking.bookingType === "LongTerm";
                const isActiveHourly =
                  booking.status === "Booked" &&
                  !isLongTerm &&
                  getBookingEndDateTime(booking) > new Date();
                return (
                  <tr key={booking._id}>
                    <td className="id-cell">{booking.bookingNumber || "—"}</td>
                    <td>{booking.parkingSlot?.slotNumber || "Deleted slot"}</td>
                    <td>{isLongTerm ? "Long-Term" : "Hourly"}</td>
                    <td>{booking.vehicleName || "—"}</td>
                    <td>{booking.vehicleNumber}</td>
                    <td>{formatDate(booking.bookingDate)}</td>
                    <td>{isLongTerm ? `${booking.durationDays} days` : booking.startTime}</td>
                    <td>
                      {isLongTerm ? formatDate(booking.endDate) : booking.endTime}
                      {isLongTerm && booking.carWashDates?.length > 0 && (
                        <small>
                          Car wash: {booking.carWashDates.map(formatDate).join(", ")}
                        </small>
                      )}
                    </td>
                    <td>
                      {getAddOnLabel(booking)}
                      {booking.addOnTotal > 0 && (
                        <small>₹{booking.addOnTotal.toFixed(2)}</small>
                      )}
                    </td>
                    <td>
                      ₹{getBookingTotal(booking).toFixed(2)}
                      {booking.overstayCharge > 0 && (
                        <small>
                          Overstay: ₹{booking.overstayCharge.toFixed(2)}
                        </small>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={ended ? "Ended" : booking.status} />
                    </td>
                    <td>
                      {booking.status === "Booked" && (
                        <div className="booking-actions">
                          {!ended && (
                            <button
                              className="button button-small button-danger"
                              onClick={() => cancel(booking)}
                            >
                              Cancel
                            </button>
                          )}
                          {isActiveHourly && (
                            <button
                              className="button button-small"
                              onClick={() => extend(booking)}
                            >
                              Extend
                            </button>
                          )}
                          <button
                            className="button button-small button-outline"
                            onClick={() => checkout(booking)}
                          >
                            Check Out
                          </button>
                        </div>
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
