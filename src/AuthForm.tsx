
import { useState, type FormEvent } from "react";
import { authClient } from "./auth-client";
import "./AuthForm.css";

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = isLogin
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ name, email, password });

      if (result.error) {
        setError(result.error.message || "Authentication failed.");
      }
    } catch {
      setError("Could not connect to the server. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-brand-icon">✓</div>
        <h1>TaskFlow</h1>
        <p className="auth-subtitle">
          {isLogin ? "Welcome back" : "Create your account"}
        </p>

        {!isLogin && (
          <label>
            Full name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              autoComplete="name"
              required
            />
          </label>
        )}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            autoComplete={isLogin ? "current-password" : "new-password"}
            minLength={8}
            required
          />
        </label>

        {error && <p className="auth-error" role="alert">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading
            ? "Please wait..."
            : isLogin
              ? "Log in"
              : "Create account"}
        </button>

        <p className="auth-switch">
          {isLogin ? "New to TaskFlow?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="auth-link"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
          >
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </p>
      </form>
    </main>
  );
}
