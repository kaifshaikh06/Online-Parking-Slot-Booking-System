import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";
import Message from "../components/Message";
import ReviewPrompt from "../components/ReviewPrompt";
import { formatDate } from "../utils/booking";

const ReviewStars = ({ rating }) => (
  <span className="review-stars" aria-label={`${rating} out of 5 stars`}>
    {"★".repeat(rating)}
    <span className="review-stars-empty">{"★".repeat(5 - rating)}</span>
  </span>
);

const Reviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState(null);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadReviews = async () => {
    const { data } = await api.get("/bookings/reviews");
    setReviews(data.reviews);
  };

  useEffect(() => {
    const loadPage = async () => {
      try {
        const requests = [loadReviews()];
        if (user?.role === "user") {
          requests.push(
            api.get("/bookings/review-prompt").then(({ data }) => {
              setPendingBooking(data.booking);
            }),
          );
        }
        await Promise.all(requests);
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      }
    };
    loadPage();
  }, [user?.role]);

  const handleReviewSubmitted = async ({ message }) => {
    setSuccess(message);
    setPendingBooking(null);
    try {
      await loadReviews();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  return (
    <main className="container page">
      <p className="eyebrow">Community feedback</p>
      <h1>Parking Reviews</h1>
      <p className="page-subtitle">
        Read real feedback from ParkEase customers. Completed parking visits can
        be reviewed once by the customer who made the booking.
      </p>

      <Message>{error}</Message>
      <Message type="success">{success}</Message>

      {pendingBooking && (
        <section className="review-prompt-card">
          <ReviewPrompt
            booking={pendingBooking}
            onSubmitted={handleReviewSubmitted}
          />
        </section>
      )}

      {!reviews ? (
        <Loading />
      ) : reviews.length === 0 ? (
        <p className="empty-state">No customer reviews have been submitted yet.</p>
      ) : (
        <section className="reviews-grid" aria-label="Customer reviews">
          {reviews.map((booking) => (
            <article className="review-card" key={booking._id}>
              <div className="review-card-heading">
                <div>
                  <strong>{booking.user?.name || "ParkEase customer"}</strong>
                  <small>
                    Slot {booking.parkingSlot?.slotNumber || "—"} ·{" "}
                    {formatDate(booking.review.createdAt)}
                  </small>
                </div>
                <ReviewStars rating={booking.review.rating} />
              </div>
              <p>{booking.review.comment}</p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
};

export default Reviews;
