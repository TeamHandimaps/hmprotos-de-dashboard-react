import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./PageLogin.scss";

/** Login page to handle gating access to the main part of the app flow. */
function PageLogin() {
  const auth = useAuth();
  // used to hold form data and update it easily
  const [creds, setCreds] = useState({ username: "id@office", password: "*****" });

  /** Login submission handler. */
  const handleSubmit = (evt) => {
    evt.preventDefault();
    auth.login({ user: creds.userename, pass: creds.password })
  };

  /** Generic input handler to handle updating creds state. */
  const handleCredsChange = (evt) => {
    // this format is the simplest for updating form data, we can specify the keys using the name prop on input/select/form controls and let it handle value updates!
    // assuming we get a consistent format for the value out of a form control, we can parse out value types whenever we do something with the form data instead of every time it is updated
    setCreds({
      ...creds,
      [evt.target.name]: evt.target.value,
    });
  };

  return (
    <div className="page-login">
      <h1>Eligibility Verification Proof of Concept App</h1>
      <form onSubmit={handleSubmit} disabled={auth.loading}>
        <label>
          Username
          <input
            name="username"
            placeholder="Username"
            type="email"
            value={creds.username}
            onChange={handleCredsChange}
            disabled={auth.loading}
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
            disabled={auth.loading}
          />
        </label>
        <button type="submit">Log In</button>
      </form>
      {auth.loading ? <p>Loading ...</p> : null}
    </div>
  );
}

export default PageLogin;
