import React, { useEffect, useState } from "react";
import CompVerificationForm from "./CompVerificationForm";
import "./NavVerify.scss";
import IFrame from "./UtilReactIFrame.js";

import DentalAPI from "../model/DentalAPI";
import { getDatabase, off, onValue, ref } from "firebase/database";
import { useAuth } from "../context/AuthContext";

/** Handles rendering verification top-level nav page. */
function NavVerify() {
  const {
    user: { office },
  } = useAuth();
  const [providers, setProviders] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState(null);

  useEffect(() => {
    const db = getDatabase();

    // handle updates for metadata regarding practices (cached office info)
    const providersRef = ref(db, `data/${office}/practices`);
    onValue(providersRef, (snap) => {
      let currentProviders = [];
      snap.forEach((child) => {
        currentProviders.push({
          key: child.key,
          val: child.val(),
        });
      });
      setProviders(currentProviders);
    });

    // handle updates for metadata regarding patients (cached patient info)
    const patientsRef = ref(db, `data/${office}/patients`);
    onValue(patientsRef, (snap) => {
      let currentPatients = [];
      snap.forEach((child) => {
        currentPatients.push({
          key: child.key,
          val: child.val(),
        });
      });
      setPatients(currentPatients);
    });

    return () => {
      off(providersRef);
      off(patientsRef);
    };
  }, [office]);

  /** Handler to help handle for submission for verification actions. */
  const handleFormSubmit = (data) => {
    setLoading(true);
    DentalAPI.getEligibility(office, data)
      .then((res) => {
        setResponseData(res);
        return true;
      })
      .catch((err) => {
        console.error("Error getting Eligibility:", err);
        return false;
      })
      .finally(() => {
        setLoading(false);
      });
  };

  /** Helper component to wrap some extra logic before we display the custom iframe! */
  const ResponseDataPreview = () => {
    if (loading) {
      return <p>Loading...</p>;
    }

    if (!responseData) {
      return null;
    }

    // determine the exact content to display!
    let content = null;
    if (!responseData.DentalInfo) {
      content = '<div class="response-html-error">' + responseData.APIResponseMessage + "</div>";
    } else {
      content = responseData.DentalInfo || "";
    }

    return <IFrame content={content} wrap={!responseData.DentalInfo} />;
  };

  // RENDER
  return (
    <div className="component-eligibility-verification">
      <h1>Patient Eligibility Verification Form</h1>
      <CompVerificationForm
        onSubmit={handleFormSubmit}
        loading={loading || providers.length === 0}
        patients={patients}
        providers={providers}
      />
      <h2>Response Data Preview</h2>
      <div className="response-data-preview">
        <ResponseDataPreview />
      </div>
    </div>
  );
}

export default NavVerify;
