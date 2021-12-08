/** Pre-formed Queries to use in the /queries/ShortQuery endpoint for OpenDental. */
export default class Queries {
  /** Returns all Insurance Plan-Subscriber links. */
  static GrabAllInsuranceSubscriberLinks = `SELECT * FROM inssub`;
  /** Return all Patient-(Subscriber)-Insurance Plan links. */
  static GrabAllPatientSubscriberLinks = `SELECT * FROM patplan`;
  /** Returns all current Insurance Plans. */
  static GrabAllInsurancePlans = `SELECT * FROM insplan`;
  /** Returns all insurance plans for patient 11. TODO: Change to method/computed property. */
  static GrabAllInsuranceForPatient = `SELECT * FROM claimproc WHERE claimproc.PatNum = 11`;
  /** Returns all patient-(subscriber)-insurance plan links for patient 11.  TODO: Change to method/computed property. */
  static GrabAllPatientPlansForPatient = `SELECT * FROM patplan WHERE patplan.PatNum = 11`;
  /** Returns all relevant information with regards to linked insurance plans for patient 11.  TODO: Change to method/computed property. */
  static GrabAllInsurancePlansForPatient = `SELECT PatPlanNum, PatNum, insplan.PlanNum, inssub.Subscriber, inssub.InsSubNum FROM patplan 
	JOIN inssub
	ON patplan.InsSubNum = inssub.InsSubNum
	JOIN insplan
	ON insplan.PlanNum = inssub.PlanNum
	WHERE
	patplan.PatNum = 11`;
}
