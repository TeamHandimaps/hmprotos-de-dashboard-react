import React, { useEffect } from "react";
import { getDatabase, ref, get } from "firebase/database";
import { useTable } from "react-table";
import "./CompPatientActivePlanEditingTable.scss";
import { SortingTypes, flattenToSortingStyle } from "../model/Utils";
import DatabaseAPI from "../model/DatabaseAPI";

const columns_by_benefit = [
  {
    Header: "Benefit",
    accessor: "benefit",
  },
  {
    Header: "In Network",
    accessor: "in_network",
  },
  {
    Header: "Out Of Network",
    accessor: "out_of_network",
  },
  {
    Header: "Out Of Service Area",
    accessor: "out_of_service_area",
  },
  {
    Header: "Message",
    accessor: "messages",
  },
  {
    Header: "Actions",
  },
];

const columns_by_network = [
  {
    Header: "Coverage",
    accessor: "coverage",
  },
  {
    Header: "Benefit",
    accessor: "benefit",
  },
  {
    Header: "Network",
    accessor: "network",
  },
  {
    Header: "Value",
    accessor: "value",
  },
  {
    Header: "Message",
    accessor: "messages",
  },
  {
    Header: "Authorization",
    accessor: "authorization",
  },
  {
    Header: "Indicator",
    accessor: "indicator",
  },
  {
    Header: "Actions",
  },
];
// Create an editable cell renderer
const EditableCell = (props) => {
  const {
    value: initialValue,
    row: { index },
    column: { id },
    cell: {
      row: {
        original: { editable, editable_cells },
      },
    },
    updateMyData, // This is a custom function that we supplied to our table instance
    submitChanges,
  } = props;

  // We need to keep and update the state of the cell normally
  const [value, setValue] = React.useState(initialValue);

  const onChange = (e) => {
    setValue(e.target.value);
  };

  // We'll only update the external data when the input is blurred
  const onBlur = () => {
    updateMyData(index, id, value);
  };

  // If the initialValue is changed external, sync it up with our state
  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const canEdit = editable && editable_cells.includes(id);

  if (editable && id === "Actions") {
    return <button onClick={() => submitChanges(props.row.original)}>Apply Changes</button>;
  }

  return canEdit ? <input value={value} onChange={onChange} onBlur={onBlur} /> : <i>{value}</i>;
};

// Set our editable cell renderer as the default Cell renderer
const defaultColumn = {
  Cell: EditableCell,
};

// Be sure to pass our updateMyData and the skipPageReset option
function Table({ columns, data, updateMyData, submitChanges, skipPageReset }) {
  // For this example, we're using pagination to illustrate how to stop
  // the current page from resetting when our data changes
  // Otherwise, nothing is different here.
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    // page,
    // canPreviousPage,
    // canNextPage,
    // pageOptions,
    // pageCount,
    // gotoPage,
    // nextPage,
    // previousPage,
    // setPageSize,
    // state: { pageIndex, pageSize },
  } = useTable({
    columns,
    data,
    defaultColumn,
    // use the skipPageReset option to disable page resetting temporarily
    autoResetPage: !skipPageReset,
    // updateMyData isn't part of the API, but
    // anything we put into these options will
    // automatically be available on the instance.
    // That way we can call this function from our
    // cell renderer!
    updateMyData,
    submitChanges,
  });

  // Render the UI for your table
  return (
    <>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>{column.render("Header")}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  const {
                    column: { id },
                    row: {
                      original: { editable, editable_cells },
                    },
                  } = cell;
                  const canEdit = editable && editable_cells.includes(id);

                  return (
                    <td {...cell.getCellProps()} className={canEdit ? "editable" : ""}>
                      <div className='cell-content'>{cell.render("Cell")}</div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

const flattenToSortingType = async (snapVal, sortingType = SortingTypes.BY_BENEFIT_TYPE) => {
  const { ServiceDetails } = snapVal;
  if (!ServiceDetails || !(ServiceDetails instanceof Array)) {
    return [];
  }

  let newServiceDetails = [];
  for (let serviceDetail of ServiceDetails) {
    const { EligibilityDetails, ServiceName } = serviceDetail;
    const newEligibilityDetails = await flattenToSortingStyle(EligibilityDetails, sortingType);
    newServiceDetails.push({ EligibilityDetails: newEligibilityDetails, ServiceName });
  }

  return newServiceDetails;
};

function CompPatientActivePlanEditingSubTable({ inputData = [], sortingType = SortingTypes.BY_BENEFIT_TYPE, title, onUpdateRow = () => {} }) {
  const [data, setData] = React.useState(() => inputData);
  const [ , setOriginalData] = React.useState(data);
  const [skipPageReset, setSkipPageReset] = React.useState(false);
  // We need to keep the table from resetting the pageIndex when we
  // Update data. So we can keep track of that flag with a ref.

  // When our cell renderer calls updateMyData, we'll use
  // the rowIndex, columnId and new value to update the
  // original data
  const updateMyData = (rowIndex, columnId, value) => {
    console.log("Updating my data", rowIndex, columnId, value);
    // We also turn on the flag to not reset the page
    setSkipPageReset(true);
    setData((old) =>
      old.map((row, index) => {
        if (index === rowIndex) {
          return {
            ...old[rowIndex],
            [columnId]: parseInt(value) || value,
          };
        }
        return row;
      })
    );
  };

  const submitChanges = (row) => {
    console.log("Current data is", data, "with row", row);
    onUpdateRow(row, title)
  };

  React.useEffect(() => {
    setData(inputData);
    setOriginalData(inputData);
  }, [inputData]);

  // After data chagnes, we turn the flag back off
  // so that if data actually changes when we're not
  // editing it, the page is reset
  React.useEffect(() => {
    setSkipPageReset(false);
  }, [data]);

  if (!inputData) {
    return "INVALID INPUT";
  }

  return (
    <details className='test-editing-table-container'>
      <summary>
        <b>{title}</b>
      </summary>
      <div className='content'>
        <Table
          columns={sortingType === SortingTypes.BY_BENEFIT_TYPE ? columns_by_benefit : columns_by_network}
          data={data}
          updateMyData={updateMyData}
          submitChanges={submitChanges}
          skipPageReset={skipPageReset}
        />
      </div>
    </details>
  );
}

function CompPatientActivePlanEditingTable({ defaultSortingType = SortingTypes.BY_NETWORK_TYPE, officeID = "office_00", patientID }) {
  const [loading, setLoading] = React.useState(false)
  const [rawData, setRawData] = React.useState([]);
  const [data, setData] = React.useState([defaultSortingType, []]);

  useEffect(() => {
    console.log("patientid?", patientID)
    if (!patientID) { return }
    const db = getDatabase();
    const responseRef = ref(db,  `data/${officeID}/patients_data/${patientID}`);
    setLoading(true)
    console.log("Running responses pull")
    get(responseRef)
      .then((snap) => {
        let result = null;
        console.log("Got response, looking through children")
        snap.forEach((child) => {
          const childVal = child.val();
          if (!childVal.PlanCoverageSummary) {
            console.log("Child DOES NOT HAVE PLAN INFO")
            return;
          }

          const { /*EffectiveDate, ExpiryDate, */ Status } = childVal.PlanCoverageSummary;
          if (Status !== "Active") {
            console.log("Child NOT ACTIVE")
            return;
          }

          // const startDate = EffectiveDate && new Date(EffectiveDate);
          // const endDate = ExpiryDate && new Date(ExpiryDate);
          // const today = Date.now();
          // if (today < startDate.getTime() || endDate.getTime() < today) {
          //   console.log("TODAY NOT IN COVERAGE ")
          //   return;
          // }
          result = { key: child.key, val: childVal };
        });

        if (result) {
          console.log("Found valid plan response! Setting Data");
          setRawData(result.val);

          flattenToSortingType(result.val, defaultSortingType).then((result) => {
            setData([defaultSortingType, result]);
          });
        } else {
          console.log("No valid plans?")
        }

        return true;
      })
      .catch((err) => {
        console.error("Error getting most valid plan?", err);
        return false;
      })
      .finally(() => {
        setLoading(false)
      })
  }, [officeID, patientID, defaultSortingType]);

  const handleSetSortingType = (type) => {
    flattenToSortingType(rawData, type).then((result) => {
      setData([type, result]);
    });
  };
  
  const onUpdateRow = async (row, title) => {
    
    //const path = "data/office_00/patients_data/04277998_jina_alcobia/32594284";
    if (sortingType === SortingTypes.BY_NETWORK_TYPE) {
      const { network, value, } = row   
      DatabaseAPI.updateUsageRow(rawData, "office_00", "04277998_jina_alcobia", "32594284", title, network, value);
      // we can update value for specific network type
    } else {
      DatabaseAPI.updateUsageRowAllNetworks(rawData, "office_00", "04277998_jina_alcobia", "32594284", title, row)
      // must update every network type for Limitations (Remaining)
    }
  }

  const [sortingType, tables] = data;

  const isBenfitTypeSort = sortingType === SortingTypes.BY_BENEFIT_TYPE

  if (loading) {
    return <h4>Loading Active Plan Information....</h4>
  }

  console.log("Tables", loading, tables)

  return (
    <div>
      <div className="sorting-controls">
        <h3>Sorting Mode:</h3>
        <button className={isBenfitTypeSort ? 'selected' : ''} onClick={() => handleSetSortingType(SortingTypes.BY_BENEFIT_TYPE)}>Sort By Benefit Type</button>
        <button className={!isBenfitTypeSort ? 'selected' : ''} onClick={() => handleSetSortingType(SortingTypes.BY_NETWORK_TYPE)}>Sort By Network Type</button>
      </div>
      {tables.map((d) => (
        <CompPatientActivePlanEditingSubTable
          key={d.ServiceName}
          inputData={d.EligibilityDetails}
          sortingType={sortingType}
          title={d.ServiceName}
          onUpdateRow={onUpdateRow}
        />
      ))}
    </div>
  );
}

export default CompPatientActivePlanEditingTable;
