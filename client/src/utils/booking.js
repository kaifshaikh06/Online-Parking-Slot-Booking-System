export const getBookingEndDateTime = (booking) => {
  if (booking.bookingType === "LongTerm" && booking.endDate) {
    return new Date(booking.endDate);
  }

  const bookingDay = new Date(booking.bookingDate).toISOString().slice(0, 10);
  return new Date(`${bookingDay}T${booking.endTime}:00`);
};

export const hasBookingEnded = (booking, now = new Date()) =>
  booking.status === "Booked" && getBookingEndDateTime(booking) <= now;

export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "—";
