import React from "react";
import ReactDOM from "react-dom";
import "./index.scss";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

/** Firebase INIT */
import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter } from "react-router-dom";

const firebaseConfig = {
  apiKey: "AIzaSyC55D2-39mghwhcPE8k5E7WGZAz9q8yYv8",
  authDomain: "hmproto-dental-eligibility-vue.firebaseapp.com",
  databaseURL: "https://hmproto-dental-eligibility-vue-default-rtdb.firebaseio.com",
  projectId: "hmproto-dental-eligibility-vue",
  storageBucket: "hmproto-dental-eligibility-vue.appspot.com",
  messagingSenderId: "529863113790",
  appId: "1:529863113790:web:eebd26fa6933a9f423e56f",
  measurementId: "G-EZGK03SJ63",
};
const app = initializeApp(firebaseConfig);
getDatabase(app);
const analytics = getAnalytics(app);
console.log("Initialized Firebase!");

/** Render app. */
ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
function sendToAnalytics({ id, name, value }) {
  logEvent(analytics, "report_web_vitals", {
    eventCategory: "Web Vitals",
    eventAction: name,
    eventValue: Math.round(name === "CLS" ? value * 1000 : value), // values must be integers
    eventLabel: id, // id unique to current page load
    nonInteraction: true, // avoids affecting bounce rate
  });
}
reportWebVitals(sendToAnalytics);
// reportWebVitals(console.log);
