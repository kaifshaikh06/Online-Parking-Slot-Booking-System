import { Link } from 'react-router-dom';

const Home = () => <main>
  <section className="hero container">
    <div>
      <p className="eyebrow">Simple parking, less waiting</p>
      <h1>Reserve your parking space before you arrive.</h1>
      <p className="hero-copy">ParkEase helps drivers see available slots, make a booking, and manage it from one clear dashboard.</p>
      <div className="button-row"><Link className="button" to="/login">Login</Link><Link className="button button-outline" to="/register">Create Account</Link></div>
    </div>
    <div className="hero-card"><span>01</span><h2>Choose a slot</h2><span>02</span><h2>Enter booking details</h2><span>03</span><h2>Park with confidence</h2></div>
  </section>
  <section className="container info-section">
    <h2>How it works</h2>
    <div className="three-grid"><article><h3>Find</h3><p>View parking spaces that are currently available.</p></article><article><h3>Book</h3><p>Add your vehicle number and preferred parking time.</p></article><article><h3>Manage</h3><p>Check or cancel your booking anytime from My Bookings.</p></article></div>
  </section>
</main>;

export default Home;
