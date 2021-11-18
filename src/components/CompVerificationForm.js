import React, { useState } from "react";
import useInput from '../hooks/useInput'
import "./CompVerificationForm.scss";


function SectionHeader({ title = "" }) {
  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
      <h2>{title}</h2>
      <div className='divider' style={{ flex: 1 }} />
    </div>
  );
}

function LabeledInput({
  label = "",
  placeholder = "",
  required = false,
  type = "text",
  bind,
  options = [],
  optionLabels = [],
}) {
  let input = <input type={type} placeholder={placeholder} required={required} {...bind} />;
  if (options.length > 0) {
    input = (
      <select {...bind}>
        {options.map((v, i) => (
          <option value={v} key={`${v}_${i}`}>
            {optionLabels.length > 0 ? optionLabels[i] : v}
          </option>
        ))}
      </select>
    );
  }

  return (
    <label required={required}>
      {label}
      {input}
    </label>
  );
}

const PAYER_CODES = {
  "Aetna Dental": "DE003",
  "CIGNA Dental": "DE005",
  "Delta Dental of Washington": "DE0171",
  "Premera Blue Cross Dental": "DE0066",
};
const PAYERS = Object.keys(PAYER_CODES);

function CompVerificationForm({ onSubmit = () => {} }) {
  

  const { value: PayerName, bind: bindPayerName, reset: resetPayerName } = useInput(PAYERS[0]);
  const {
    value: PayerVerificationType,
    bind: bindPayerVerificationType,
    reset: resetPayerVerificationType,
  } = useInput("");
  const {
    value: PayerVerificationCriteria,
    bind: bindPayerVerificationCriteria,
    reset: resetPayerVerificationCriteria,
  } = useInput("");

  const {
    value: ProviderName,
    bind: bindProviderName,
    reset: resetProviderName,
  } = useInput("Implant & Periodontic Specialists");
  const { value: ProviderNpi, bind: bindProviderNpi, reset: resetProviderNpi } = useInput("1790036903");
  const { value: ProviderGroupNpi, bind: bindProviderGroupNpi, reset: resetProviderGroupNpi } = useInput("");
  const { value: ProviderTaxId, bind: bindProviderTaxId, reset: resetProviderTaxId } = useInput("203321275");

  const {
    value: SubscriberMemberId,
    bind: bindSubscriberMemberId,
    reset: resetSubscriberMemberId,
  } = useInput("04277998");
  const { value: SubscriberSsn, bind: bindSubscriberSsn, reset: resetSubscriberSsn } = useInput("");
  const {
    value: SubscriberMedicareId,
    bind: bindSubscriberMedicareId,
    reset: resetSubscriberMedicareId,
  } = useInput("");
  const {
    value: SubscriberMedicaidId,
    bind: bindSubscriberMedicaidId,
    reset: resetSubscriberMedicaidId,
  } = useInput("");
  const {
    value: SubscriberFirstName,
    bind: bindSubscriberFirstName,
    reset: resetSubscriberFirstName,
  } = useInput("Jina");
  const {
    value: SubscriberLastName,
    bind: bindSubscriberLastName,
    reset: resetSubscriberLastName,
  } = useInput("Alcobia");
  const { value: SubscriberDob, bind: bindSubscriberDob, reset: resetSubscriberDob } = useInput("03/15/1990");
  const { value: SubscriberGender, bind: bindSubscriberGender, reset: resetSubscriberGender } = useInput("F");

  const { value: PracticeType, bind: bindPracticeType, reset: resetPracticeType } = useInput("");
  const { value: MiscFromDate, bind: bindMiscFromDate, reset: resetMiscFromDate } = useInput("12/31/2021");
  const { value: MiscToDate, bind: bindMiscToDate, reset: resetMiscToDate } = useInput("12/31/2021");
  const {
    value: MiscMrnPatientAccountNum,
    bind: bindMiscMrnPatientAccountNum,
    reset: resetMiscMrnPatientAccountNum,
  } = useInput("");
  const { value: MiscPlaceOfService, bind: bindMiscPlaceOfService, reset: resetMiscPlaceOfService } = useInput("");
  const { value: MiscLocation, bind: bindMiscLocation, reset: resetMiscLocation } = useInput("US");


  const allResets = [
    resetPayerName,
    resetPayerVerificationType,
    resetPayerVerificationCriteria,
    resetProviderName,
    resetProviderNpi,
    resetProviderGroupNpi,
    resetProviderTaxId,
    resetSubscriberMemberId,
    resetSubscriberSsn,
    resetSubscriberMedicareId,
    resetSubscriberMedicaidId,
    resetSubscriberFirstName,
    resetSubscriberLastName,
    resetSubscriberDob,
    resetSubscriberGender,
    resetPracticeType,
    resetMiscFromDate,
    resetMiscToDate,
    resetMiscMrnPatientAccountNum,
    resetMiscPlaceOfService,
    resetMiscLocation,
  ];

  const handleSubmit = (evt) => {
    evt.preventDefault();
    console.log("Submit!");

    const allValues = {
      PayerCode: PAYER_CODES[PayerName],
      PayerName: PayerName,
      PayerVerificationType: PayerVerificationType,
      PayerVerificationCriteria: PayerVerificationCriteria,
      ProviderName: ProviderName,
      ProviderNpi: ProviderNpi,
      ProviderGroupNpi: ProviderGroupNpi,
      ProviderTaxId: ProviderTaxId,
      SubscriberMemberId: SubscriberMemberId,
      SubscriberSsn: SubscriberSsn,
      SubscriberMedicareId: SubscriberMedicareId,
      SubscriberMedicaidId: SubscriberMedicaidId,
      SubscriberFirstName: SubscriberFirstName,
      SubscriberLastName: SubscriberLastName,
      SubscriberDob: SubscriberDob,
      SubscriberGender: SubscriberGender,
      PracticeType: PracticeType,
      MiscFromDate: MiscFromDate,
      MiscToDate: MiscToDate,
      MiscMrnPatientAccountNum: MiscMrnPatientAccountNum,
      MiscPlaceOfService: MiscPlaceOfService,
      MiscLocation: MiscLocation,
    };
    // allResets.forEach(async (fn) => await fn());
    onSubmit(allValues)
  };

  const handleClear = async (evt) => {
    evt.preventDefault();
    console.log("Clear!");
    allResets.forEach(async (fn) => await fn());
  };

  return (
      <form className="component-verification-form" onSubmit={handleSubmit}>
        <SectionHeader title='Payer' />
        <div className='row'>
          <LabeledInput
            label='Payer Name'
            required
            bind={bindPayerName}
            id='payer-name'
            options={PAYERS}
          />
          <LabeledInput
            label='Payer Verification Type'
            required
            bind={bindPayerVerificationType}
            id='payer-verification-type'
            options={["Self", "Dependent"]}
          />
        </div>

        <SectionHeader title='Provider' />
        <div className='row'>
          <LabeledInput label='Provider Name' required bind={bindProviderName} id='provider-name' />
          <LabeledInput label='Provider Npi' required bind={bindProviderNpi} id='provider-npi' />
          <LabeledInput label='Provider Group Npi' bind={bindProviderGroupNpi} id='provider-group-npi' />
          <LabeledInput label='Provider Tax Id' required bind={bindProviderTaxId} id='provider-tax-id' />
        </div>

        <SectionHeader title='Subscriber' />
        <div className='row'>
          <LabeledInput label='Subscriber Member Id' required bind={bindSubscriberMemberId} id='subscriber-member-id' />
          <LabeledInput label='Subscriber Ssn' bind={bindSubscriberSsn} id='subscriber-ssn' />
          <LabeledInput label='Subscriber Medicare Id' bind={bindSubscriberMedicareId} id='subscriber-medicare-id' />
          <LabeledInput label='Subscriber Medicaid Id' bind={bindSubscriberMedicaidId} id='subscriber-medicaid-id' />
          <LabeledInput
            label='Subscriber First Name'
            required
            bind={bindSubscriberFirstName}
            id='subscriber-first-name'
          />
          <LabeledInput label='Subscriber Last Name' required bind={bindSubscriberLastName} id='subscriber-last-name' />
          <LabeledInput label='Subscriber Dob' required bind={bindSubscriberDob} id='subscriber-dob' />
          <LabeledInput
            label='Subscriber Gender'
            bind={bindSubscriberGender}
            id='subscriber-gender'
            options={["M", "F"]}
          />
        </div>

        <SectionHeader title='Misc' />
        <div className='row'>
          <LabeledInput label='Practice Type' bind={bindPracticeType} id='practice-type' options={["Dental*"]} />
          <LabeledInput label='Misc From Date' bind={bindMiscFromDate} id='misc-from-date' />
          <LabeledInput label='Misc To Date' bind={bindMiscToDate} id='misc-to-date' />
          <LabeledInput
            label='Misc Mrn Patient Account Num'
            bind={bindMiscMrnPatientAccountNum}
            id='misc-mrn-patient-account-num'
          />
          <LabeledInput label='Misc Place Of Service' bind={bindMiscPlaceOfService} id='misc-place-of-service' />
          <LabeledInput label='Misc Location' bind={bindMiscLocation} id='misc-location' options={["US"]} />
        </div>

        <div className='divider' />

        <div className='row centered'>
          <button type='submit'>Verify</button>
          <button type='button' onClick={handleClear}>
            Clear
          </button>
        </div>
      </form>
  );
}

export default CompVerificationForm;
