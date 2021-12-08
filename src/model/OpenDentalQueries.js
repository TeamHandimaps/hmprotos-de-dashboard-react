export default class Queries {
	static GrabAllInsuranceSubscriberLinks = `SELECT * FROM inssub`
	static GrabAllPatientSubscriberLinks = `SELECT * FROM patplan`

	static GrabAllInsurancePlans = `SELECT * FROM insplan`

  static GrabAllInsuranceForPatient = `SELECT * FROM claimproc WHERE claimproc.PatNum = 11`;
  
  static GrabAllPatientPlansForPatient = `SELECT * FROM patplan WHERE patplan.PatNum = 11`;

  static GrabAllInsurancePlansForPatient = `SELECT PatPlanNum, PatNum, insplan.PlanNum, inssub.Subscriber, inssub.InsSubNum FROM patplan 
	JOIN inssub
	ON patplan.InsSubNum = inssub.InsSubNum
	JOIN insplan
	ON insplan.PlanNum = inssub.PlanNum
	WHERE
	patplan.PatNum = 11`;
}
