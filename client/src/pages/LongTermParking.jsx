import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../services/api";
import Loading from "../components/Loading";
import Message from "../components/Message";

const DAILY_RATE = 1000;
const today = new Date().toISOString().slice(0, 10);

const addDays = (day, days) => {
  if (!day) return null;
  const date = new Date(`${day}T00:00:00`);
  date.setDate(date.getDate() + Number(days));
  return date;
};

const LongTermParking = () => {
  const [slots, setSlots] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({
    vehicleName: "",
    vehicleNumber: "",
    bookingDate: today,
    durationDays: 2,
  });
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const detailsRef = useRef(null);
  const navigate = useNavigate();

  const loadSlots = () =>
    api
      .get("/slots", { params: { status: "Available" } })
      .then(({ data }) =>
        setSlots(
          data.slots.filter((slot) => /^A-(1[6-9]|20)$/.test(slot.slotNumber)),
        ),
      )
      .catch((requestError) => setError(getErrorMessage(requestError)));

  useEffect(() => {
    loadSlots();
  }, []);

  const checkoutDate = useMemo(
    () => addDays(form.bookingDate, form.durationDays),
    [form.bookingDate, form.durationDays],
  );
  const washDays = Math.floor(Number(form.durationDays) / 3);
  const total = Number(form.durationDays) * DAILY_RATE;

  const selectSlot = (slot) => {
    setSelectedSlot(slot);
    setPaymentOpen(false);
    setError("");
    setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const preparePayment = (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!selectedSlot) {
      setError("Please choose an available parking slot.");
      return;
    }
    if (Number(form.durationDays) < 2 || Number(form.durationDays) > 30) {
      setError("Choose a stay from 2 to 30 days.");
      return;
    }
    setPaymentOpen(true);
  };

  const completeDummyPayment = async () => {
    setSaving(true);
    setError("");
    try {
      await api.post("/bookings/long-term", {
        ...form,
        parkingSlot: selectedSlot._id,
      });
      setPaymentOpen(false);
      setSuccess("Payment completed. Your long-term parking is confirmed.");
      setTimeout(() => navigate("/my-bookings"), 1400);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setPaymentOpen(false);
      setSelectedSlot(null);
      loadSlots();
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="container page">
      <p className="eyebrow">Extended stay parking</p>
      <h1>Long-Term Parking</h1>
      <p className="page-subtitle">
        Reserve one of the dedicated A-16 to A-20 Level A spaces for 2 to 30
        days at a fixed rate of ₹1,000 per day. Your car receives a
        complimentary wash every third day.
      </p>

      <Message>{error}</Message>
      <Message type="success">{success}</Message>

      <section className="long-term-benefits">
        <article>
          <strong>₹1,000</strong>
          <span>per day, fixed rate</span>
        </article>
        <article>
          <strong>2–30 days</strong>
          <span>flexible duration</span>
        </article>
        <article>
          <strong>Every 3rd day</strong>
          <span>complimentary car wash</span>
        </article>
      </section>

      {!slots ? (
        <Loading />
      ) : slots.length === 0 ? (
        <p className="empty-state">No parking spaces are available right now.</p>
      ) : (
        <>
          <section className="long-term-slot-section">
            <p className="eyebrow">Step 1</p>
            <h2>Select an available parking space</h2>
            <div className="slot-grid long-term-slot-grid">
              {slots.map((slot) => (
                <button
                  type="button"
                  className={`slot-card slot-choice ${selectedSlot?._id === slot._id ? "selected" : ""}`}
                  key={slot._id}
                  onClick={() => selectSlot(slot)}
                  aria-pressed={selectedSlot?._id === slot._id}
                >
                  <strong>🚗 {slot.slotNumber}</strong>
                  <span>Level A</span>
                  <small>Available for long-term parking</small>
                </button>
              ))}
            </div>
          </section>

          {selectedSlot && (
            <form
              ref={detailsRef}
              className="form-card long-term-form"
              onSubmit={preparePayment}
            >
              <div className="booking-form-heading">
                <div>
                  <p className="eyebrow">Step 2 · {selectedSlot.slotNumber}</p>
                  <h2>Tell us about your car and stay</h2>
                </div>
                <div className="booking-rate">
                  <span>Daily rate</span>
                  <strong>₹{DAILY_RATE}/day</strong>
                </div>
              </div>
              <div className="form-grid">
                <label>
                  Parking Slot
                  <input value={`${selectedSlot.slotNumber} — Level A`} disabled />
                </label>
                <label>
                  Car Name
                  <input
                    value={form.vehicleName}
                    onChange={(event) =>
                      setForm({ ...form, vehicleName: event.target.value })
                    }
                    placeholder="Example: Honda City"
                    maxLength="60"
                    required
                  />
                </label>
                <label>
                  Vehicle Number
                  <input
                    value={form.vehicleNumber}
                    onChange={(event) =>
                      setForm({ ...form, vehicleNumber: event.target.value.toUpperCase() })
                    }
                    placeholder="GJ05AB1234"
                    required
                  />
                </label>
                <label>
                  Start Date
                  <input
                    type="date"
                    min={today}
                    value={form.bookingDate}
                    onChange={(event) =>
                      setForm({ ...form, bookingDate: event.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Duration (days)
                  <input
                    type="number"
                    min="2"
                    max="30"
                    value={form.durationDays}
                    onChange={(event) =>
                      setForm({ ...form, durationDays: event.target.value })
                    }
                    required
                  />
                </label>
              </div>

              <section className="long-term-summary">
                <div>
                  <span>Checkout date</span>
                  <strong>{checkoutDate?.toLocaleDateString()}</strong>
                </div>
                <div>
                  <span>Car washes included</span>
                  <strong>{washDays || "No wash scheduled"}</strong>
                </div>
                <div>
                  <span>Estimated total</span>
                  <strong>₹{total.toLocaleString()}</strong>
                </div>
              </section>

              {paymentOpen ? (
                <section className="dummy-payment">
                  <div>
                    <p className="eyebrow">Demo payment</p>
                    <h3>Confirm your long-term parking payment</h3>
                    <p>No real transaction is processed in this demonstration.</p>
                  </div>
                  <strong>₹{total.toLocaleString()}</strong>
                  <div className="payment-actions">
                    <button
                      type="button"
                      className="button"
                      onClick={completeDummyPayment}
                      disabled={saving}
                    >
                      {saving ? "Processing payment..." : "Pay & Confirm"}
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

export default LongTermParking;
