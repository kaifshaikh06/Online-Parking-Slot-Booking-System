import { Link } from "react-router-dom";

const Home = () => (
  <main>
    <section className="home-hero">
      <div className="container home-hero-content">
        <div className="home-intro">
          <p className="eyebrow">Simple parking, less waiting</p>
          <h1>Reserve your parking space before you arrive.</h1>
          <p className="hero-copy">
            ParkEase helps drivers see available slots, make a booking, and
            manage it from one clear dashboard.
          </p>
          <div className="button-row">
            <Link className="button" to="/login">
              Login
            </Link>
            <Link className="button button-light" to="/register">
              Create Account
            </Link>
          </div>
        </div>
        <div className="hero-steps" aria-label="How ParkEase works">
          <span>01</span>
          <p>
            <strong>Choose a slot</strong>View spaces that are available now.
          </p>
          <span>02</span>
          <p>
            <strong>Enter booking details</strong>Add your vehicle and parking
            time.
          </p>
          <span>03</span>
          <p>
            <strong>Park with confidence</strong>Manage your booking anytime.
          </p>
        </div>
      </div>
    </section>
    <section className="container info-section">
      <h2>How it works</h2>
      <div className="three-grid">
        <article>
          <h3>Find</h3>
          <p>View parking spaces that are currently available.</p>
        </article>
        <article>
          <h3>Book</h3>
          <p>Add your vehicle number and preferred parking time.</p>
        </article>
        <article>
          <h3>Manage</h3>
          <p>Check or cancel your booking anytime from My Bookings.</p>
        </article>
      </div>
    </section>
  </main>
);

export default Home;
