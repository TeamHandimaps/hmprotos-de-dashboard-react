import React, { useState } from "react";
import "./CompVerificationForm.scss";
import dayjs from "dayjs";

/** Helper Component to handle rendering section headers in the form.
 *
 * @param props.title The title to use for the section header.
 */
function SectionHeader({ title = "" }) {
  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
      <h2>{title}</h2>
      <div className="divider" style={{ flex: 1 }} />
    </div>
  );
}

/** Payer Codes Map. */
const PAYER_CODES = {
  "Aetna Dental": "DE003",
  "CIGNA Dental": "DE005",
  "Delta Dental of Washington": "DE0171",
  "Premera Blue Cross Dental": "DE0066",
};
/** Keys of the payer codes map which correspond to their "descriptive" names. */
const PAYERS = Object.keys(PAYER_CODES);

/** Defalt data to use as the initial form data. */
const defaultFormData = {
  PayerCode: "DE0171",
  PayerName: "Delta Dental of Washington",
  PayerVerificationType: "Self",
  PayerVerificationCriteria: "",
  ProviderName: "",
  ProviderNpi: "",
  ProviderGroupNpi: "",
  ProviderTaxId: "",
  SubscriberMemberId: "",
  SubscriberSsn: "",
  SubscriberMedicareId: "",
  SubscriberMedicaidId: "",
  SubscriberFirstName: "",
  SubscriberLastName: "",
  SubscriberDob: "",
  SubscriberGender: "",

  PatientFirstName: "",
  PatientLastName: "",
  PatientDOB: "",

  PracticeType: "",
  MiscFromDate: dayjs().format("YYYY-MM-DD"),
  MiscToDate: dayjs().format("YYYY-MM-DD"),
  MiscMrnPatientAccountNum: "",
  MiscPlaceOfService: "",
  MiscLocation: "",
};

/** Handles rendering the verification form for running eligibility verification. */
function CompVerificationForm({ loading = false, providers = [], patients = [], onSubmit = () => {} }) {
  const [formData, setFormData] = useState(defaultFormData);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  /** Helpers to handle generating the values we need for mapping the select options. */
  const providersToUse = [{ key: "", val: { name: "Provide provider info or select saved..." } }, ...providers];
  const patientsToUse = [{ key: "", val: { patientName: "Provide subscriber info or select saved..." } }, ...patients];

  /** Handles submitting the verification form data for running the eligibility request. */
  const handleSubmit = (evt) => {
    evt.preventDefault();

    // TODO: Definitely move this to some kind of dedicated validation method/handler so to prevent pre-mature submission attempts
    let validation = true;
    // check all general requirements
    if (
      !formData.PayerName ||
      !PAYER_CODES[formData.PayerName] ||
      !formData.ProviderName ||
      !formData.ProviderNpi ||
      !formData.ProviderTaxId ||
      !formData.SubscriberMemberId ||
      !formData.MiscFromDate ||
      !formData.MiscToDate
    ) {
      validation = false;
    }

    if (formData.PayerVerificationType === "Self") {
      if (!formData.SubscriberFirstName || !formData.SubscriberLastName || !formData.SubscriberDob) {
        validation = false;
      }
    } else if (formData.PayerVerificationType === "Dependent") {
      if (!formData.PatientFirstName || !formData.PatientLastName || !formData.PatientDOB) {
        validation = false;
      }
    }

    if (!validation) {
      window.alert("Unable to submit form, please fill out required fields!");
      return;
    }

    // heres what we care about, we take all the form data, and then parse out some of the more important information
    // specifically we get the payer code, and then for all the dates we parse the date stored by the date-type inputs into
    // formatted strings in the correct format for using in the API (we could also do this later on, but at least here
    // we guarantee the format of the dates that come out of this component via the onSubmit method)
    let formDataToSubmit = {
      ...formData,
      PayerCode: PAYER_CODES[formData.PayerName],
      SubscriberDob: dayjs(formData.SubscriberDob).format("MM/DD/YYYY"),
      MiscFromDate: dayjs(formData.MiscFromDate).format("MM/DD/YYYY"),
      MiscToDate: dayjs(formData.MiscToDate).format("MM/DD/YYYY"),
    };

    onSubmit(formDataToSubmit);
  };

  /** Handles clearing the current form data. */
  const handleClear = async (evt) => {
    evt.preventDefault();
    setSelectedPatient("");
    setSelectedProvider("");
    setFormData(defaultFormData);
  };

  /** Handles updating the selected provider on a select item change. */
  const handleSelectProviderChange = (evt) => {
    setSelectedProvider(evt.target.value);

    const currentProvider = providers.find((v) => v.key === evt.target.value) || {
      val: { name: "", npi: "", taxid: "" },
    };
    if (currentProvider) {
      const {
        val: { name, npi, taxid },
      } = currentProvider;
      // updates the form data with any new values in the provider fields!
      setFormData({
        ...formData,
        ProviderName: name || "",
        ProviderNpi: npi || "",
        ProviderTaxId: taxid || "",
        ProviderGroupNpi: "",
      });
    }
    // no provider ? don't update
  };

  /** Handles updating the selected patient on a select item change. */
  const handleSelectPatientChange = (evt) => {
    setSelectedPatient(evt.target.value);

    const currentPatient = patients.find((v) => v.key === evt.target.value) || { val: { patientName: "" } };
    if (currentPatient) {
      const {
        val: { patientFirstName, patientLastName, patientDOB, patientGender, patientMemberID },
      } = currentPatient;

      let dobToUse = patientDOB || "";
      if (patientDOB) {
        dobToUse = dayjs(patientDOB).format("YYYY-MM-DD");
      }

      // updates the form data with any new values in the subscriber fields!
      setFormData({
        ...formData,
        SubscriberMemberId: patientMemberID || "",
        SubscriberSsn: "",
        SubscriberMedicareId: "",
        SubscriberMedicaidId: "",
        SubscriberFirstName: patientFirstName || "",
        SubscriberLastName: patientLastName || "",
        SubscriberDob: dobToUse,
        SubscriberGender: patientGender || "",
      });
    }
    // no patient ? don't update
  };

  // this format is the simplest for updating form data, we can specify the keys using the name prop on input/select/form controls and let it handle value updates!
  // assuming we get a consistent format for the value out of a form control, we can parse out value types whenever we do something with the form data instead of every time it is updated
  const handleFormDataInputChange = (evt) => {
    setFormData({
      ...formData,
      [evt.target.name]: evt.target.value,
    });
  };

  return (
    <div className="component-verification-form-root">
      <form className="component-verification-form" onSubmit={handleSubmit}>
        <SectionHeader title="Payer" />
        <div className="row">
          <label required>
            Payer Name
            <select value={formData.PayerName} onChange={handleFormDataInputChange} name="PayerName">
              {PAYERS.map((v) => (
                <option key={PAYER_CODES[v]} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            Payer Verification Type
            <select
              value={formData.PayerVerificationType}
              onChange={handleFormDataInputChange}
              name="PayerVerificationType"
            >
              {["Self", "Dependent"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>

        <SectionHeader title="Provider" />
        <div className="row">
          <label>
            <b>Select Provider (optional)</b>
            <select value={selectedProvider} onChange={handleSelectProviderChange}>
              {providersToUse.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.val.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="row">
          <label required>
            Provider Name
            <input
              disabled={selectedProvider}
              value={formData.ProviderName}
              onChange={handleFormDataInputChange}
              name="ProviderName"
            />
          </label>

          <label required>
            Provider NPI
            <input
              disabled={selectedProvider}
              value={formData.ProviderNpi}
              onChange={handleFormDataInputChange}
              name="ProviderNpi"
            />
          </label>

          <label>
            Provider Group NPI
            <input
              disabled={selectedProvider}
              value={formData.ProviderGroupNpi}
              onChange={handleFormDataInputChange}
              name="ProviderGroupNpi"
            />
          </label>

          <label required>
            Provider Tax ID
            <input
              disabled={selectedProvider}
              value={formData.ProviderTaxId}
              onChange={handleFormDataInputChange}
              name="ProviderTaxId"
            />
          </label>
        </div>

        <SectionHeader title="Subscriber" />
        <div className="row">
          <label>
            <b>Select Subscriber (optional)</b>
            <select value={selectedPatient} onChange={handleSelectPatientChange}>
              {patientsToUse.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.val.patientName}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="row">
          <label required>
            Subscriber Member Id
            <input
              disabled={selectedPatient}
              value={formData.SubscriberMemberId}
              onChange={handleFormDataInputChange}
              name="SubscriberMemberId"
            />
          </label>

          <label>
            Subscriber SSN
            <input
              disabled={selectedPatient}
              value={formData.SubscriberSsn}
              onChange={handleFormDataInputChange}
              name="SubscriberSsn"
            />
          </label>

          <label>
            Subscriber Medicare ID
            <input
              disabled={selectedPatient}
              value={formData.SubscriberMedicareId}
              onChange={handleFormDataInputChange}
              name="SubscriberMedicareId"
            />
          </label>

          <label>
            Subscriber Medicaid ID
            <input
              disabled={selectedPatient}
              value={formData.SubscriberMedicaidId}
              onChange={handleFormDataInputChange}
              name="SubscriberMedicaidId"
            />
          </label>

          <label required={formData.PayerVerificationType === "Self"}>
            Subscriber First Name
            <input
              disabled={selectedPatient}
              value={formData.SubscriberFirstName}
              onChange={handleFormDataInputChange}
              name="SubscriberFirstName"
            />
          </label>

          <label required={formData.PayerVerificationType === "Self"}>
            Subscriber Last Name
            <input
              disabled={selectedPatient}
              value={formData.SubscriberLastName}
              onChange={handleFormDataInputChange}
              name="SubscriberLastName"
            />
          </label>

          <label required={formData.PayerVerificationType === "Self"}>
            Subscriber DOB
            <input
              disabled={selectedPatient}
              type="date"
              value={formData.SubscriberDob}
              onChange={handleFormDataInputChange}
              name="SubscriberDob"
            />
          </label>

          <label>
            Subscriber Gender
            <select
              disabled={selectedPatient}
              value={formData.SubscriberGender}
              onChange={handleFormDataInputChange}
              name="SubscriberMedicaidId"
            >
              {["Select Gender...", "M", "F"].map((v) => (
                <option key={v} value={v.length > 5 ? "" : v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>

        {formData.PayerVerificationType === "Dependent" ? (
          <>
            <SectionHeader title="Patient (Dependent)" />
            <div className="row">
              <label required={formData.PayerVerificationType === "Dependent"}>
                Patient First Name
                <input value={formData.PatientFirstName} onChange={handleFormDataInputChange} name="PatientFirstName" />
              </label>

              <label required={formData.PayerVerificationType === "Dependent"}>
                Patient Last Name
                <input value={formData.PatientLastName} onChange={handleFormDataInputChange} name="PatientLastName" />
              </label>

              <label required={formData.PayerVerificationType === "Dependent"}>
                Patient DOB
                <input type="date" value={formData.PatientDOB} onChange={handleFormDataInputChange} name="PatientDOB" />
              </label>
            </div>
          </>
        ) : null}

        <SectionHeader title="Misc" />
        <div className="row">
          <label>
            Misc Practice Type
            <select value={formData.PracticeType} onChange={handleFormDataInputChange} name="PracticeType">
              {["Dental*"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label>
            Misc Mrn Patient Account Num
            <input
              value={formData.MiscMrnPatientAccountNum}
              onChange={handleFormDataInputChange}
              name="MiscMrnPatientAccountNum"
            />
          </label>
          <label required>
            Misc From Date
            <input type="date" value={formData.MiscFromDate} onChange={handleFormDataInputChange} name="MiscFromDate" />
          </label>
          <label required>
            Misc To Date
            <input type="date" value={formData.MiscToDate} onChange={handleFormDataInputChange} name="MiscToDate" />
          </label>
          <label>
            Misc Place Of Service
            <input value={formData.MiscPlaceOfService} onChange={handleFormDataInputChange} name="MiscPlaceOfService" />
          </label>

          <label>
            Misc Location
            <select value={formData.MiscLocation} onChange={handleFormDataInputChange} name="MiscLocation">
              {["US"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="divider" />

        <div className="row centered">
          <button type="submit">Verify</button>
          <button type="button" onClick={handleClear}>
            Clear
          </button>
        </div>
      </form>
      {loading ? (
        <div className="component-verification-form-loading-overlay">
          <h2>Loading...</h2>
        </div>
      ) : null}
    </div>
  );
}

export default CompVerificationForm;
