import React from "react";
import "./CompPatientInfoDetail.scss";
import { getDatabase, ref, off, onValue } from "firebase/database";

function IFrameReact({ content, wrap = true }) {
    const frameRef = React.useRef(null);

    React.useEffect(() => {
        const document = frameRef.current.contentDocument;
        console.log(document, document.html)
        document.body.innerHTML = content 
    }, [content])

    return <iframe ref={frameRef} style={{ height: wrap ? 'auto' : '500px'}}/>
}


function CompPatientInfoDetail({ item, officeID = "office_00", onBack = () => {} }) {
    const [requests, setRequests] = React.useState([]);
    const { lastRequestTime, lastRequestID, patientName, patientDOB, patientMemberID } = item.val;
  
  const onErrorHandler = (err) => {
    console.error("Database Error:", err);
  };

  React.useEffect(() => {
    const patientsRef = ref(getDatabase(), `data/${officeID}/patients_data/${item.key}`);

    const handlePatientsSnapshot = (snap) => {
      let items = [];
      snap.forEach((child) => {
        items.push({ key: child.key, val: child.val() });
      });
      console.log("Got info!", items)
      const getTime = item => new Date(item.val.timestamp).getTime()
      items.sort((a,b) => getTime(b) - getTime(a))
      setRequests(items);
    };

    onValue(patientsRef, handlePatientsSnapshot, onErrorHandler);

    return () => off(patientsRef);
  }, [officeID]);

  console.log("Requests?", requests)
  const requestsList = requests.map(v => {
        const { key, val } = v
        const { PayerName, PverifyPayerCode, DentalInfo, APIResponseMessage, timestamp } = val

        let content = null
        if (!DentalInfo) {
            content = '<div class="response-html-error">' + APIResponseMessage + '</div>'
        } else {
            content = DentalInfo
        }

        const time = new Date(timestamp).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });

        return <details key={key}>
            <summary className={DentalInfo ? 'success' : 'failure'}>Request: {PayerName} ({PverifyPayerCode}) - {time}</summary>
            <div className="detail-content">
                <IFrameReact content={content} wrap={!DentalInfo} />
            </div>
        </details>
    })



  return (
    <div className='component-patient-info-detail'>
      <div className='header'>
        <div className="header-left">
            <button onClick={onBack}>Back</button>
        </div>
        <div className='header-center'>
          <h1>Patient Info Detail:</h1> <h2>{patientName}</h2>
        </div>
        <span className="header-right"/>
      </div>

      <div> {patientDOB} </div>

      <div className="requests-list">
          {requestsList}
      </div>
    </div>
  );
}

export default CompPatientInfoDetail;
