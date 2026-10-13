import { useState } from "react";
import api, { getErrorMessage } from "../services/api";
import Message from "./Message";

const ReviewPrompt = ({ booking, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submitReview = async (event) => {
    event.preventDefault();
    setError("");
    if (!rating) {
      setError("Please select a rating from 1 to 5 stars.");
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.post(`/bookings/${booking._id}/review`, {
        rating,
        comment,
      });
      onSubmitted?.(data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="review-form" onSubmit={submitReview}>
      <div>
        <p className="eyebrow">Your recent visit</p>
        <h2>How was your parking experience?</h2>
        <p>
          Tell us about booking #{booking.bookingNumber} at slot{" "}
          {booking.parkingSlot?.slotNumber || "your parking space"}.
        </p>
      </div>
      <Message>{error}</Message>
      <div className="star-input" aria-label="Choose your rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            className={star <= rating ? "selected" : ""}
            onClick={() => setRating(star)}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            aria-pressed={star === rating}
          >
            ★
          </button>
        ))}
      </div>
      <label>
        Review comment
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Share what went well or how we can improve."
          maxLength="500"
          required
        />
      </label>
      <button className="button" disabled={saving}>
        {saving ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
};

export default ReviewPrompt;
