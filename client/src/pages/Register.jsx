import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../services/api";
import Message from "../components/Message";

const namePattern = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;
const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const phonePattern = /^\d{10}$/;

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const change = (event) => {
    const { name, value } = event.target;
    const nextValue =
      name === "name"
        ? value.replace(/[^A-Za-z '-]/g, "")
        : name === "phone"
          ? value.replace(/\D/g, "").slice(0, 10)
          : value;
    setForm({ ...form, [name]: nextValue });
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!namePattern.test(form.name.trim()))
      return setError("Name must contain letters only.");
    if (!emailPattern.test(form.email.trim()))
      return setError(
        "Enter a valid email address, for example name@example.com.",
      );
    if (!phonePattern.test(form.phone))
      return setError("Phone number must contain exactly 10 digits.");
    if (form.password.length < 6)
      return setError("Password must be at least 6 characters long.");
    if (form.password !== form.confirmPassword)
      return setError("Passwords do not match.");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      setSuccess(data.message);
      setTimeout(() => navigate("/login"), 800);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page register-page">
      <form className="auth-card" onSubmit={submit}>
        <p className="eyebrow">Create account</p>
        <h1>Register for ParkEase</h1>
        <Message>{error}</Message>
        <Message type="success">{success}</Message>
        <label>
          Name
          <input
            name="name"
            value={form.name}
            onChange={change}
            placeholder="Enter your full name"
            pattern="[A-Za-z '-]+"
            maxLength="60"
            required
          />
        </label>
        <label>
          Email
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={change}
            placeholder="name@example.com"
            autoComplete="email"
            required
          />
        </label>
        <label>
          Phone
          <input
            name="phone"
            type="tel"
            inputMode="numeric"
            value={form.phone}
            onChange={change}
            placeholder="9876543210"
            minLength="10"
            maxLength="10"
            required
          />
        </label>
        <label>
          Password
          <span className="password-field">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={change}
              minLength="6"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </span>
        </label>
        <label>
          Confirm Password
          <span className="password-field">
            <input
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={change}
              minLength="6"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
              title={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
            >
              {showConfirmPassword ? "🙈" : "👁"}
            </button>
          </span>
        </label>
        <button className="button" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>
        <p className="muted">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </form>
    </main>
  );
};

export default Register;
