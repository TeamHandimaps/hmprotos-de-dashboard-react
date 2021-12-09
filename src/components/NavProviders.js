import React, { useState } from "react";
import "./NavProviders.scss";
import { getDatabase, ref, off, onValue, push, set, remove } from "firebase/database";

/** Helper component to handle displaying the "info" card, which allows for adding a new entry to the saved data. */
function InfoCard({ officeID = "office_00", item }) {
  const { key, val } = item;
  const { npi, name, taxid } = val;

  const [editing, setEditing] = useState(false);
  const [formState, setFormState] = useState({
    name: name,
    npi: npi,
    taxid: taxid,
  });

  const handleSubmit = (evt) => {
    evt.preventDefault();

    const db = getDatabase();
    const entryRef = ref(db, `data/${officeID}/practices/${key}`);
    set(entryRef, formState).finally((res) => setEditing(false));
  };

  const handleInputChange = (evt) => {
    console.log("Change", evt.target.value, evt.target.name);
    setFormState({
      ...formState,
      [evt.target.name]: evt.target.value,
    });
  };

  const handleRemove = (evt) => {
    const shouldRemove = window.confirm("Are you sure you want to remove this entry?");
    if (shouldRemove) {
      const db = getDatabase();
      const entryRef = ref(db, `data/${officeID}/practices/${key}`);
      remove(entryRef).finally(() => alert(`Removed entry (${key})!`));
    }
  };

  return (
    <div className="info-card">
      <form onSubmit={handleSubmit}>
        <label>
          Name
          <input name="name" disabled={!editing} value={formState.name} onChange={handleInputChange} />
        </label>

        <label>
          National Provider Identifier (NPI)
          <input name="npi" disabled={!editing} value={formState.npi} onChange={handleInputChange} />
        </label>

        <label>
          Tax ID
          <input name="taxid" disabled={!editing} value={formState.taxid} onChange={handleInputChange} />
        </label>
        {editing ? <button type="submit">Submit Changes</button> : null}
      </form>
      {editing ? null : (
        <div className="controls">
          <button onClick={() => setEditing(true)}>Edit</button>
          <button onClick={() => handleRemove()}>Remove</button>
        </div>
      )}
    </div>
  );
}

/** Helper component to handle displaying the "add" card, which allows for adding a new entry to the saved data. */
function AddCard({ onClick = () => {} }) {
  return (
    <div className="info-card">
      <button onClick={onClick}>
        <b>Add Entry</b>
        <b>+</b>
      </button>
    </div>
  );
}

/** Handles rendering the top level "Providers" page for the navigation. */
function NavProviders({ officeID = "office_00" }) {
  const [loading, setLoading] = React.useState(true);
  const [practices, setPractices] = useState([]);

  const onErrorHandler = (err) => {
    console.error("Database Error:", err);
  };

  React.useEffect(() => {
    const practicesRef = ref(getDatabase(), `data/${officeID}/practices`);

    const handleMetaSnapshot = (snap) => {
      let data = [];
      snap.forEach((child) => {
        data.push({
          key: child.key,
          val: child.val(),
        });
      });
      setPractices(data);
      setLoading(false);
    };

    onValue(practicesRef, handleMetaSnapshot, onErrorHandler);
    return () => off(practicesRef);
  }, [officeID]);

  const handleAddEntry = (evt) => {
    const db = getDatabase();
    const practicesRef = ref(db, `data/${officeID}/practices`);
    const newEntryRef = push(practicesRef);
    set(newEntryRef, {
      name: "{name here}",
      npi: "{npi here}",
      taxid: "{tax id here}",
    });
  };

  let items = practices.map((p) => <InfoCard item={p} key={p.key} />);
  items.push(<AddCard key="addoncard" onClick={handleAddEntry} />);

  return (
    <div className="comp-info">
      <h1>Saved Provider Information</h1>
      {loading ? <h2>Loading saved provider information....</h2> : <div className="info-grid">{items}</div>}
    </div>
  );
}

export default NavProviders;
