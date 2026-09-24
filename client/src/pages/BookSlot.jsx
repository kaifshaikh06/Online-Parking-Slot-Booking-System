import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../services/api";
import Loading from "../components/Loading";
import Message from "../components/Message";

const today = new Date().toISOString().slice(0, 10);
const parkingSpaceNumbers = Array.from(
  { length: 20 },
  (_, index) => `A-${String(index + 1).padStart(2, "0")}`,
);

const getDurationInHours = (startTime, endTime) => {
  if (!startTime || !endTime || endTime <= startTime) return 0;
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  return (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60;
};

const BookSlot = () => {
  const [slots, setSlots] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    vehicleNumber: "",
    bookingDate: today,
    startTime: "",
    endTime: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const bookingFormRef = useRef(null);
  const navigate = useNavigate();

  const loadSlots = () =>
    api
      .get("/slots")
      .then(({ data }) => setSlots(data.slots))
      .catch((err) => setError(getErrorMessage(err)));
  const loadSchedule = (bookingDate) =>
    api
      .get("/bookings/schedule", { params: { bookingDate } })
      .then(({ data }) => setSchedule(data.bookings))
      .catch((err) => setError(getErrorMessage(err)));
  useEffect(() => {
    loadSlots();
  }, []);
  useEffect(() => {
    if (form.bookingDate) loadSchedule(form.bookingDate);
  }, [form.bookingDate]);

  const duration = getDurationInHours(form.startTime, form.endTime);
  const hasChosenTime = duration > 0;
  const parkingMap = useMemo(
    () =>
      parkingSpaceNumbers.map(
        (slotNumber) =>
          slots?.find((slot) => slot.slotNumber === slotNumber) || {
            slotNumber,
            status: "Not configured",
          },
      ),
    [slots],
  );
  const estimatedCost = selected && duration ? selected.price * duration : 0;

  const changeSchedule = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setSelected(null);
    setPaymentOpen(false);
  };

  const getSpaceDetails = (slot) => {
    const slotBookings = schedule.filter(
      (booking) => String(booking.parkingSlot) === String(slot._id),
    );
    const conflict =
      hasChosenTime &&
      slotBookings.find(
        (booking) =>
          booking.startTime < form.endTime && booking.endTime > form.startTime,
      );
    const nextBooking =
      slotBookings.find((booking) => booking.endTime > form.startTime) ||
      slotBookings[0];
    const manuallyBlocked =
      slot.status === "Booked" && slotBookings.length === 0;
    const selectable =
      Boolean(slot._id) && hasChosenTime && !conflict && !manuallyBlocked;
    return { slotBookings, conflict, nextBooking, manuallyBlocked, selectable };
  };

  const chooseSlot = (slot) => {
    const details = getSpaceDetails(slot);
    if (!details.selectable) return;
    setSelected(slot);
    setPaymentOpen(false);
    setError("");
    setTimeout(
      () =>
        bookingFormRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      0,
    );
  };

  const preparePayment = (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!selected || !hasChosenTime)
      return setError(
        "Choose a valid booking time and available parking space.",
      );
    setPaymentOpen(true);
  };

  const completeDummyPayment = async () => {
    setError("");
    setSaving(true);
    try {
      await api.post("/bookings", { ...form, parkingSlot: selected._id });
      setPaymentOpen(false);
      setSuccess(
        "Payment completed successfully. Your parking booking is confirmed.",
      );
      setTimeout(() => navigate("/my-bookings"), 1400);
    } catch (err) {
      setError(getErrorMessage(err));
      setPaymentOpen(false);
      setSelected(null);
      loadSlots();
      loadSchedule(form.bookingDate);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="container page">
      <p className="eyebrow">Make a reservation</p>
      <h1>Book a Parking Slot</h1>
      <p className="page-subtitle">
        Pick your date and hours first. A space marked as booked becomes
        selectable again for a later, non-overlapping time.
      </p>
      <Message>{error}</Message>
      <Message type="success">{success}</Message>
      {!slots ? (
        <Loading />
      ) : (
        <>
          <section className="schedule-picker">
            <div>
              <p className="eyebrow">Step 1</p>
              <h2>Choose your parking time</h2>
              <p>Spaces update using the date and time you select.</p>
            </div>
            <div className="schedule-inputs">
              <label>
                Booking Date
                <input
                  type="date"
                  min={today}
                  value={form.bookingDate}
                  onChange={(event) =>
                    changeSchedule("bookingDate", event.target.value)
                  }
                  required
                />
              </label>
              <label>
                Start Time
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(event) =>
                    changeSchedule("startTime", event.target.value)
                  }
                  required
                />
              </label>
              <label>
                End Time
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(event) =>
                    changeSchedule("endTime", event.target.value)
                  }
                  required
                />
              </label>
            </div>
          </section>
          {form.startTime && form.endTime && !hasChosenTime && (
            <Message>End time must be later than start time.</Message>
          )}
          <div className="parking-map-heading">
            <div>
              <p className="eyebrow">Step 2</p>
              <h2>Select a parking space</h2>
            </div>
            <div className="parking-legend">
              <span>
                <i className="legend available" />
                Available for selected time
              </span>
              <span>
                <i className="legend booked" />
                Booked for selected time
              </span>
              <span>
                <i className="legend unavailable" />
                Not configured
              </span>
            </div>
          </div>
          <section className="parking-map" aria-label="Parking space map">
            {parkingMap.map((slot) => {
              const details = getSpaceDetails(slot);
              const isSelected = selected?._id === slot._id;
              const unavailable = !slot._id || details.manuallyBlocked;
              const booked =
                Boolean(details.conflict) || details.manuallyBlocked;
              const scheduleText = details.conflict
                ? `Free after ${details.conflict.endTime}`
                : details.nextBooking
                  ? `Reserved: ${details.nextBooking.startTime}–${details.nextBooking.endTime}`
                  : "No other bookings";
              const status = unavailable
                ? slot.status === "Not configured"
                  ? "Not configured"
                  : "Unavailable"
                : booked
                  ? `Booked until ${details.conflict?.endTime || ""}`
                  : details.selectable
                    ? isSelected
                      ? "Selected"
                      : "Book this space"
                    : "Choose a time";
              return (
                <button
                  type="button"
                  key={slot.slotNumber}
                  className={`parking-space ${booked ? "booked" : unavailable ? "unavailable" : "available"} ${isSelected ? "selected" : ""}`}
                  onClick={() => chooseSlot(slot)}
                  disabled={!details.selectable}
                  aria-pressed={isSelected}
                >
                  <span className="parking-car" aria-hidden="true">
                    🚗
                  </span>
                  <span className="parking-space-number">
                    {slot.slotNumber}
                  </span>
                  <span className="parking-rate">
                    {slot._id ? `₹${slot.price}/hr` : "—"}
                  </span>
                  <span className="parking-status">{status}</span>
                  <span className="parking-schedule">{scheduleText}</span>
                </button>
              );
            })}
          </section>
          {selected && (
            <form
              ref={bookingFormRef}
              className="form-card booking-form"
              onSubmit={preparePayment}
            >
              <div className="booking-form-heading">
                <div>
                  <p className="eyebrow">Step 3 · Selected space</p>
                  <h2>Booking details for {selected.slotNumber}</h2>
                </div>
                <div className="booking-rate">
                  <span>Hourly rate</span>
                  <strong>₹{selected.price}/hr</strong>
                </div>
              </div>
              <div className="form-grid">
                <label>
                  Parking Slot
                  <input value={`${selected.slotNumber} — Level A`} disabled />
                </label>
                <label>
                  Vehicle Number
                  <input
                    value={form.vehicleNumber}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        vehicleNumber: event.target.value.toUpperCase(),
                      })
                    }
                    placeholder="GJ05AB1234"
                    required
                  />
                </label>
                <label>
                  Booking Date
                  <input value={form.bookingDate} disabled />
                </label>
                <label>
                  Start Time
                  <input value={form.startTime} disabled />
                </label>
                <label>
                  End Time
                  <input value={form.endTime} disabled />
                </label>
              </div>
              <div className="booking-estimate">
                <span>
                  Estimated charge for {duration} hour
                  {duration !== 1 ? "s" : ""}
                </span>
                <strong>₹{estimatedCost.toFixed(2)}</strong>
              </div>
              {paymentOpen ? (
                <section className="dummy-payment">
                  <div>
                    <p className="eyebrow">payment</p>
                    <h3>Confirm your payment</h3>
                    <p>
                      This is a demonstration only. No real payment is
                      processed.
                    </p>
                  </div>
                  <strong>₹{estimatedCost.toFixed(2)}</strong>
                  <div className="payment-actions">
                    <button
                      type="button"
                      className="button"
                      onClick={completeDummyPayment}
                      disabled={saving}
                    >
                      {saving
                        ? "Processing payment..."
                        : `Pay ₹${estimatedCost.toFixed(2)}`}
                    </button>
                    <button
                      type="button"
                      className="button button-outline"
                      onClick={() => setPaymentOpen(false)}
                      disabled={saving}
                    >
                      Back
                    </button>
                  </div>
                </section>
              ) : (
                <button className="button">Proceed to Payment</button>
              )}
            </form>
          )}
        </>
      )}
    </main>
  );
};

export default BookSlot;
