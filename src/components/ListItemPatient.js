import React from "react";
import "./ListItemPatient.scss";

function ListItemPatient({ item }) {
  return <div className="list-item-patient">Hello World {JSON.stringify(item, null, 2)}</div>;
}

export default ListItemPatient;
