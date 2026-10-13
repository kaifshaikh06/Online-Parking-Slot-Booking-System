import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    vehicleNumber: "",
    vehicleName: "",
    bookingDate: today,
    startTime: "",
    endTime: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [servicePickerOpen, setServicePickerOpen] = useState(false);
  const [selectedServiceCodes, setSelectedServiceCodes] = useState([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const bookingFormRef = useRef(null);
  const navigate = useNavigate();

  const loadSlots = () =>
    api
      .get("/slots")
      .then(({ data }) => setSlots(data.slots))
      .catch((requestError) => setError(getErrorMessage(requestError)));

  useEffect(() => {
    loadSlots();
    api
      .get("/bookings/services")
      .then(({ data }) => setServices(data.services))
      .catch((requestError) => setError(getErrorMessage(requestError)));
  }, []);

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

  const duration = getDurationInHours(form.startTime, form.endTime);
  const estimatedCost = selected && duration ? selected.price * duration : 0;
  const selectedServices = services.filter((service) =>
    selectedServiceCodes.includes(service.code),
  );
  const serviceTotal = selectedServices.reduce(
    (total, service) => total + service.price,
    0,
  );
  const totalCost = estimatedCost + serviceTotal;

  const chooseSlot = (slot) => {
    if (slot.status !== "Available") return;

    setSelected(slot);
    setSelectedServiceCodes([]);
    setServicePickerOpen(false);
    setPaymentOpen(false);
    setError("");
    setTimeout(() => {
      bookingFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  const preparePayment = (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selected) {
      setError("Please select an available parking slot.");
      return;
    }

    if (!form.startTime || !form.endTime) {
      setError("Start time and end time are required.");
      return;
    }

    if (form.endTime <= form.startTime) {
      setError("End time must be later than start time.");
      return;
    }

    setServicePickerOpen(true);
  };

  const toggleService = (serviceCode) => {
    setSelectedServiceCodes((current) =>
      current.includes(serviceCode)
        ? current.filter((code) => code !== serviceCode)
        : [...current, serviceCode],
    );
  };

  const continueToPayment = () => {
    setServicePickerOpen(false);
    setPaymentOpen(true);
  };

  const completeDummyPayment = async () => {
    setError("");
    setSaving(true);

    try {
      await api.post("/bookings", {
        ...form,
        parkingSlot: selected._id,
        addOnCodes: selectedServiceCodes,
      });
      setServicePickerOpen(false);
      setPaymentOpen(false);
      setSuccess(
        "Payment completed successfully. Your parking booking is confirmed.",
      );
      setTimeout(() => navigate("/my-bookings"), 1400);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setPaymentOpen(false);
      setSelected(null);
      loadSlots();
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="container page">
      <p className="eyebrow">Make a reservation</p>
      <h1>Book a Parking Slot</h1>
      <p className="page-subtitle">
        Booked spaces are unavailable until their active booking ends. Select an
        available space to reserve it by the hour.
      </p>
      <section className="long-term-entry">
        <div>
          <strong>Need parking for more than one day?</strong>
          <span>
            Use A-16 to A-20 for long-term parking from 2 to 30 days.
          </span>
        </div>
        <Link className="button button-outline" to="/long-term-parking">
          Long-Term Parking
        </Link>
      </section>

      <Message>{error}</Message>
      <Message type="success">{success}</Message>

      {!slots ? (
        <Loading />
      ) : (
        <>
          <div className="parking-map-heading">
            <div>
              <p className="eyebrow">Step 1</p>
              <h2>Select a parking space</h2>
            </div>
            <div className="parking-legend">
              <span>
                <i className="legend available" />
                Available
              </span>
              <span>
                <i className="legend booked" />
                Booked
              </span>
              <span>
                <i className="legend unavailable" />
                Not configured
              </span>
            </div>
          </div>

          <section className="parking-map" aria-label="Parking space map">
            {parkingMap.map((slot) => {
              const isAvailable = slot.status === "Available";
              const isSelected = selected?._id === slot._id;
              const state = isAvailable
                ? "available"
                : slot.status === "Booked"
                  ? "booked"
                  : "unavailable";

              return (
                <button
                  type="button"
                  key={slot.slotNumber}
                  className={`parking-space ${state} ${isSelected ? "selected" : ""}`}
                  onClick={() => chooseSlot(slot)}
                  disabled={!isAvailable}
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
                  <span className="parking-status">
                    {isAvailable
                      ? isSelected
                        ? "Selected"
                        : "Available"
                      : slot.status}
                  </span>
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
                  <p className="eyebrow">Step 2 · Selected space</p>
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
                  Car Name
                  <input
                    value={form.vehicleName}
                    onChange={(event) =>
                      setForm({ ...form, vehicleName: event.target.value })
                    }
                    placeholder="Example: Hyundai Creta"
                    maxLength="60"
                    required
                  />
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
                  Start Time
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(event) =>
                      setForm({ ...form, startTime: event.target.value })
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
                      setForm({ ...form, endTime: event.target.value })
                    }
                    required
                  />
                </label>
              </div>

              {duration > 0 && (
                <div className="booking-estimate">
                  <span>
                    Estimated charge for {duration} hour
                    {duration !== 1 ? "s" : ""}
                  </span>
                  <strong>₹{estimatedCost.toFixed(2)}</strong>
                </div>
              )}

              {servicePickerOpen ? (
                <section className="service-picker">
                  <div className="service-picker-heading">
                    <div>
                      <p className="eyebrow">Optional quick services</p>
                      <h3>Enhance your parking visit</h3>
                      <p>
                        Select any service you would like us to complete while
                        your vehicle is parked. You can also skip this step.
                      </p>
                    </div>
                    <span className="service-picker-count">
                      {selectedServices.length} selected
                    </span>
                  </div>

                  <div className="service-grid">
                    {services.map((service) => {
                      const isSelected = selectedServiceCodes.includes(
                        service.code,
                      );
                      return (
                        <button
                          type="button"
                          key={service.code}
                          className={`service-card ${isSelected ? "selected" : ""}`}
                          onClick={() => toggleService(service.code)}
                          aria-pressed={isSelected}
                        >
                          <span className="service-card-check" aria-hidden="true">
                            {isSelected ? "✓" : "+"}
                          </span>
                          <strong>{service.name}</strong>
                          <small>{service.description}</small>
                          <b>₹{service.price}</b>
                        </button>
                      );
                    })}
                  </div>

                  <div className="service-summary">
                    <span>Selected service total</span>
                    <strong>₹{serviceTotal.toFixed(2)}</strong>
                  </div>

                  <div className="service-picker-actions">
                    <button
                      type="button"
                      className="button button-outline"
                      onClick={continueToPayment}
                    >
                      Skip & Continue
                    </button>
                    <button
                      type="button"
                      className="button"
                      onClick={continueToPayment}
                      disabled={selectedServices.length === 0}
                    >
                      Add Services & Continue
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setServicePickerOpen(false)}
                    >
                      Back to Booking Details
                    </button>
                  </div>
                </section>
              ) : paymentOpen ? (
                <section className="dummy-payment">
                  <div>
                    <p className="eyebrow">Payment</p>
                    <h3>Confirm your payment</h3>
                    <p>
                      This is a demonstration only. No real payment is
                      processed.
                    </p>
                  </div>
                  <div className="payment-breakdown">
                    <span>Parking</span>
                    <strong>₹{estimatedCost.toFixed(2)}</strong>
                    {selectedServices.length > 0 && (
                      <>
                        <span>Quick services</span>
                        <strong>₹{serviceTotal.toFixed(2)}</strong>
                      </>
                    )}
                    <span>Total</span>
                    <strong>₹{totalCost.toFixed(2)}</strong>
                  </div>
                  <div className="payment-actions">
                    <button
                      type="button"
                      className="button"
                      onClick={completeDummyPayment}
                      disabled={saving}
                    >
                      {saving
                        ? "Processing payment..."
                        : `Pay ₹${totalCost.toFixed(2)}`}
                    </button>
                    <button
                      type="button"
                      className="button button-outline"
                      onClick={() => {
                        setPaymentOpen(false);
                        setServicePickerOpen(true);
                      }}
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
