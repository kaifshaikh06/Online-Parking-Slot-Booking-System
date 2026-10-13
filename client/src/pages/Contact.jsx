import { useState } from "react";
import Message from "../components/Message";

const supportEmail = "support@parkease.com";
const supportPhone = "+91 98765 43210";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Contact = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submitContact = (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.subject.trim() || !form.message.trim()) {
      setError("Please complete every contact form field.");
      return;
    }
    if (!emailPattern.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    const body = [
      `Name: ${form.name.trim()}`,
      `Email: ${form.email.trim()}`,
      "",
      form.message.trim(),
    ].join("\n");
    window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(
      form.subject.trim(),
    )}&body=${encodeURIComponent(body)}`;
    setSuccess("Your email app has been opened with your support request.");
  };

  return (
    <main className="container page">
      <p className="eyebrow">We are here to help</p>
      <h1>Contact ParkEase</h1>
      <p className="page-subtitle">
        Contact us for parking emergencies, booking questions, or any other
        assistance.
      </p>

      <div className="contact-layout">
        <section className="contact-details">
          <article>
            <span>Emergency support</span>
            <a href={`tel:${supportPhone.replace(/\s/g, "")}`}>{supportPhone}</a>
            <p>Call us if you need immediate help at the parking location.</p>
          </article>
          <article>
            <span>Email support</span>
            <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
            <p>We will respond to booking questions as soon as possible.</p>
          </article>
        </section>

        <form className="form-card contact-form" onSubmit={submitContact}>
          <h2>Send a message</h2>
          <Message>{error}</Message>
          <Message type="success">{success}</Message>
          <div className="form-grid">
            <label>
              Your Name
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                maxLength="60"
                required
              />
            </label>
            <label>
              Email Address
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
            </label>
          </div>
          <label>
            Subject
            <input
              value={form.subject}
              onChange={(event) => setForm({ ...form, subject: event.target.value })}
              maxLength="100"
              required
            />
          </label>
          <label>
            Message
            <textarea
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
              maxLength="1000"
              required
            />
          </label>
          <button className="button">Open Email to Send</button>
        </form>
      </div>
    </main>
  );
};

export default Contact;
