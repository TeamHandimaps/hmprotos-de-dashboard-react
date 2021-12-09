import React, { useState } from "react";
import "./PageLogin.scss";

/** Login page to handle gating access to the main part of the app flow. */
function PageLogin({ onLoginCallback = () => {} }) {
  const [creds, setCreds] = useState({ username: "id@office", password: "*****" });
  const [loading, setLoading] = useState(false);

  /** Login submission handler. */
  const handleSubmit = (evt) => {
    evt.preventDefault();

    console.log("Log In", evt.target);

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginCallback({ auth: true, username: creds.username, password: creds.password });
    }, 500);
  };

  /** Generic input handler to handle updating creds state. */
  const handleCredsChange = (evt) => {
    setCreds({
      ...creds,
      [evt.target.name]: evt.target.value,
    });
  };

  return (
    <div className="page-login">
      <h1>Eligibility Verification Proof of Concept App</h1>
      <form onSubmit={handleSubmit} disabled={loading}>
        <label>
          Username
          <input
            name="username"
            placeholder="Username"
            type="email"
            value={creds.username}
            onChange={handleCredsChange}
            disabled={loading}
          />
        </label>
        <label>
          Password
          <input
            name="password"
            placeholder="Password"
            type="password"
            value={creds.password}
            onChange={handleCredsChange}
            disabled={loading}
          />
        </label>
        <button type="submit">Log In</button>
      </form>
      {loading ? <p>Loading ...</p> : null}
    </div>
  );
}

export default PageLogin;
