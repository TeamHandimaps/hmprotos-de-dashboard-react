import React, { useState } from "react";
import useInput from '../hooks/useInput'
import "./PageLogin.scss";

function PageLogin({ onLoginCallback = () => {} }) {
  const { value: user, bind: bindUser /*, reset: resetUser*/ } = useInput('id@office');
  const { value: pass, bind: bindPass /*, reset: resetPass*/ } = useInput('*********');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (evt) => {
    evt.preventDefault();

    console.log("Log In", evt.target);

    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      onLoginCallback({ auth: true, username: user, password: pass });
    }, 500);
  };

  return (
    <div className="page-login">
      <h1>Eligibility Verification Proof of Concept App</h1>
      <form onSubmit={handleSubmit} disabled={loading}>
        <label>Username
          <input id="username" placeholder="Username" type="email" {...bindUser} disabled={loading} />
        </label>
        <label>Password
          <input id="password" placeholder="Password" type="password" {...bindPass} disabled={loading} />
        </label>
        <button type="submit">Log In</button>
      </form>
      {loading ? <p>Loading ...</p> : null}
    </div>
  );
}

export default PageLogin;
