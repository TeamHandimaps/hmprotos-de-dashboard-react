import React from "react";
import ReactDOM from "react-dom";
import "./index.scss";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

/** Firebase INIT */
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

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
console.log("Initialized firebase!");

export const db = getDatabase(app);
console.log("Initialized Firebase RTDB!");

/** Render app. */
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
