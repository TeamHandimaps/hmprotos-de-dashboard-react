import React, { useEffect } from "react";
import { getDatabase, ref, get } from "firebase/database";
import { useTable } from "react-table";
import "./CompPatientActivePlanEditingTable.scss";
import { SortingTypes, flattenToSortingStyle } from "../model/Utils";
import DatabaseAPI from "../model/DatabaseAPI";
import { useAuth } from "../context/AuthContext";

/// Util Components/Functions

/** Columns to use when running sorting by benefit.  */
const COLS_BY_BENEFIT = [
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
/** Columns to use when using sorting by network. */
const COLS_BY_NETWORK = [
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

/** Editable Cell, which handles displaying editing capabilities on a per-cell basis for the table. 
 * 
 * @param {object} props Should be the props handed in by react-table
*/
const EditableCell = (props) => {
  // too many props to dereference above, so we dereference just the necessary props below
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

  /** Handler for value changes (single input for cell, so we can just update our saved value directly). */
  const onChange = (e) => {
    setValue(e.target.value);
  };

  /** Handler for updating on the "blur" event. */
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

/** Set our editable cell renderer as the default Cell renderer. */
const DEFAULT_COLUMN = {
  Cell: EditableCell,
};

// * @param {Object} props Props to use for this component
/** Be sure to pass our updateMyData and the skipPageReset option. 
 * 
 * @param {*} columns The schema to use when laying out the columns for the table.
 * @param {*} data The data to use tot display in the table.
 * @param {*} updateMyData The function used when updating a cell/row for the data locally.
 * @param {*} submitChanges The function used when submitting changes for being saved in the database.
 * @param {*} skipPageReset Whether or not to 
*/
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
    defaultColumn: DEFAULT_COLUMN,
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
  // below teh nested mapping essentially just renders each row, then for each row it maps in the cells for that row and renders those
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
                      <div className="cell-content">{cell.render("Cell")}</div>
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

/** 
 * Helper function to flatten the list of data to the appropriate format to be displayed in one of two sorting types.
 * 
 * @param {*} snapVal The value of the snapshot retrieved for the response data.
 * @param {*} sortingType The sorting type to flatten the response data to.
 * @returns 
 */
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

/** Sub Table Helper Component. */
function CompPatientActivePlanEditingSubTable({
  inputData = [],
  sortingType = SortingTypes.BY_BENEFIT_TYPE,
  title,
  onUpdateRow = () => {},
}) {
  const [data, setData] = React.useState(() => inputData);
  const [, setOriginalData] = React.useState(data);
  const [skipPageReset, setSkipPageReset] = React.useState(false);
  // We need to keep the table from resetting the pageIndex when we
  // Update data. So we can keep track of that flag with a ref.

  // When our cell renderer calls updateMyData, we'll use
  // the rowIndex, columnId and new value to update the
  // original data
  /** Performs an update of the overall data for this sub table. */
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

  /** Submits changes for a particular row in this sub table. */
  const submitChanges = (row) => {
    console.log("Current data is", data, "with row", row);
    onUpdateRow(row, title);
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
    <details className="test-editing-table-container">
      <summary>
        <b>{title}</b>
      </summary>
      <div className="content">
        <Table
          columns={sortingType === SortingTypes.BY_BENEFIT_TYPE ? COLS_BY_BENEFIT : COLS_BY_NETWORK}
          data={data}
          updateMyData={updateMyData}
          submitChanges={submitChanges}
          skipPageReset={skipPageReset}
        />
      </div>
    </details>
  );
}

/** Component to handle rendering the active plan editing table. */
function CompPatientActivePlanEditingTable({
  defaultSortingType = SortingTypes.BY_NETWORK_TYPE,
  patientID,
}) {
  const { user: { office }} = useAuth();
  // state management
  const [loading, setLoading] = React.useState(false);
  const [rawData, setRawData] = React.useState([]);
  const [data, setData] = React.useState([defaultSortingType, []]);
  // helpers
  const [sortingType, tables] = data;
  const isBenfitTypeSort = sortingType === SortingTypes.BY_BENEFIT_TYPE;

  useEffect(() => {
    if (!patientID) { // no id? return 
      return;
    }

    const responseRef = ref(getDatabase(), `data/${office}/patients_data/${patientID}`);
    setLoading(true);
    // here we just retrieve the responses for the patient
    get(responseRef)
      .then((snap) => {
        let result = null;
        snap.forEach((child) => {
          const childVal = child.val();
          // no plan coverage summary ? cannot use
          if (!childVal.PlanCoverageSummary) {
            return;
          }

          const { /*EffectiveDate, ExpiryDate, */ Status } = childVal.PlanCoverageSummary;
          // not active plan ? cannot use response
          if (Status !== "Active") { 
            // TODO: need to add this when sending an eligibility verification, not checking it on stale data.
            return;
          }

          // time check to see if response has expired
          // TODO: need to add this when sending an eligibility verification, not checking it on stale data.

          // const startDate = EffectiveDate && new Date(EffectiveDate);
          // const endDate = ExpiryDate && new Date(ExpiryDate);
          // const today = Date.now();
          // if (today < startDate.getTime() || endDate.getTime() < today) {
          //   console.log("TODAY NOT IN COVERAGE ")
          //   return;
          // }
          result = { key: child.key, val: childVal };
        });

        // got active plan (may be stale) ?
        if (result) {
          // set reference to raw data
          setRawData(result);
          // set flattened data for displaying
          flattenToSortingType(result.val, defaultSortingType).then((result) => {
            setData([defaultSortingType, result]);
          });
        }
        return true;
      })
      .catch((err) => {
        console.error("Error getting most valid plan?", err);
        return false;
      })
      .finally(() => {
        setLoading(false); // always finish loading
      });
  }, [office, patientID, defaultSortingType]);

  /** Handles updating the sorting type */
  const handleSetSortingType = (type) => {
    flattenToSortingType(rawData.val, type).then((result) => {
      setData([type, result]);
    });
  };

  /** Handles updating the data in the row in the database. */
  const onUpdateRow = async (row, title) => {
    if (sortingType === SortingTypes.BY_NETWORK_TYPE) {
      const { network, value } = row;
      DatabaseAPI.updateUsageRow(rawData.val, office, patientID, rawData.key, title, network, value);
      // we can update value for specific network type
    } else {
      DatabaseAPI.updateUsageRowAllNetworks(rawData.val, office, patientID, rawData.key, title, row);
      // must update every network type for Limitations (Remaining)
    }
  };


  // loading ? return placeholder
  if (loading) {
    return <h4>Loading Active Plan Information....</h4>;
  }

  // RENDER
  return (
    <div>
      <div className="sorting-controls">
        <h3>Sorting Mode:</h3>
        <button
          className={isBenfitTypeSort ? "selected" : ""}
          onClick={() => handleSetSortingType(SortingTypes.BY_BENEFIT_TYPE)}
        >
          Sort By Benefit Type
        </button>
        <button
          className={!isBenfitTypeSort ? "selected" : ""}
          onClick={() => handleSetSortingType(SortingTypes.BY_NETWORK_TYPE)}
        >
          Sort By Network Type
        </button>
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
