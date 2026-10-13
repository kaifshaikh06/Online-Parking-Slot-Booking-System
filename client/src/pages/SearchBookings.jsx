import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../services/api";
import Loading from "../components/Loading";
import Message from "../components/Message";
import StatusBadge from "../components/StatusBadge";
import { formatDate, hasBookingEnded } from "../utils/booking";

const getAddOnLabel = (booking) => {
  if (!booking.addOns?.length) return "No services";
  return booking.addOns.map((addOn) => addOn.name).join(", ");
};

const BookingRows = ({ bookings }) => (
  <div className="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Booking ID</th>
          <th>User</th>
          <th>Slot Number</th>
          <th>Parking Type</th>
          <th>Car Name</th>
          <th>Vehicle Number</th>
          <th>Booking Date</th>
          <th>Duration / Start</th>
          <th>Ends</th>
          <th>Quick Services</th>
          <th>Status</th>
          <th>Created Date</th>
        </tr>
      </thead>
      <tbody>
        {bookings.map((booking) => {
          const isLongTerm = booking.bookingType === "LongTerm";
          return (
            <tr key={booking._id}>
              <td className="id-cell">{booking.bookingNumber || "—"}</td>
              <td>
                {booking.user?.name || "Deleted user"}
                <small>{booking.user?.email}</small>
              </td>
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
                <StatusBadge
                  status={hasBookingEnded(booking) ? "Ended" : booking.status}
                />
              </td>
              <td>{formatDate(booking.createdAt)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const SearchBookings = () => {
  const [bookings, setBookings] = useState(null);
  const [query, setQuery] = useState({
    slotNumber: "",
    vehicleNumber: "",
    vehicleName: "",
  });
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const loadAll = () =>
    api
      .get("/bookings")
      .then(({ data }) => setBookings(data.bookings))
      .catch((requestError) => setError(getErrorMessage(requestError)));

  useEffect(() => {
    loadAll();
  }, []);

  const search = async (event) => {
    event.preventDefault();
    setError("");
    setSearched(true);
    try {
      const { data } = await api.get("/bookings/search", { params: query });
      setBookings(data.bookings);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const clear = () => {
    setQuery({ slotNumber: "", vehicleNumber: "", vehicleName: "" });
    setSearched(false);
    loadAll();
  };

  return (
    <main className="container page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Admin area</p>
          <h1>Bookings & Search</h1>
          <p className="page-subtitle">
            Long-term bookings are marked below with their duration, end date,
            and scheduled car-wash dates.
          </p>
        </div>
      </div>
      <form className="search-form" onSubmit={search}>
        <label>
          Slot Number
          <input
            value={query.slotNumber}
            onChange={(event) =>
              setQuery({ ...query, slotNumber: event.target.value })
            }
            placeholder="A-01"
          />
        </label>
        <label>
          Vehicle Number
          <input
            value={query.vehicleNumber}
            onChange={(event) =>
              setQuery({ ...query, vehicleNumber: event.target.value })
            }
            placeholder="GJ05AB1234"
          />
        </label>
        <label>
          Car Name
          <input
            value={query.vehicleName}
            onChange={(event) =>
              setQuery({ ...query, vehicleName: event.target.value })
            }
            placeholder="Example: Honda City"
          />
        </label>
        <button className="button">Search</button>
        {searched && (
          <button type="button" className="button button-outline" onClick={clear}>
            Show All
          </button>
        )}
      </form>
      <Message>{error}</Message>
      {!bookings ? (
        <Loading />
      ) : bookings.length === 0 ? (
        <p className="empty-state">No bookings found.</p>
      ) : (
        <BookingRows bookings={bookings} />
      )}
    </main>
  );
};

export default SearchBookings;
