/**
 * Curated suggestion lists for the Education form's School and Degree
 * fields -- powers a <datalist> so typing prefills/suggests matches, same
 * "curated list, not a live lookup" honesty as skillTaxonomy.ts. This is
 * NOT an exhaustive global universities database (that needs a real API or
 * dataset this app doesn't have); it's the common-degree-types list (small
 * and genuinely complete) plus a reasonably broad set of well-known
 * institutions, backstopped by the browser's own autocomplete (which
 * remembers whatever a user has typed into a similarly-named field before,
 * on top of whatever's listed here).
 */

export const commonDegrees: string[] = [
  "High School Diploma",
  "Associate of Arts (A.A.)",
  "Associate of Science (A.S.)",
  "Bachelor of Arts (B.A.)",
  "Bachelor of Science (B.S.)",
  "Bachelor of Engineering (B.Eng.)",
  "Bachelor of Technology (B.Tech.)",
  "Bachelor of Business Administration (B.B.A.)",
  "Bachelor of Fine Arts (B.F.A.)",
  "Master of Arts (M.A.)",
  "Master of Science (M.S.)",
  "Master of Business Administration (M.B.A.)",
  "Master of Engineering (M.Eng.)",
  "Master of Fine Arts (M.F.A.)",
  "Master of Public Administration (M.P.A.)",
  "Master of Social Work (M.S.W.)",
  "Juris Doctor (J.D.)",
  "Doctor of Medicine (M.D.)",
  "Doctor of Philosophy (Ph.D.)",
  "Doctor of Education (Ed.D.)",
];

export const commonSchools: string[] = [
  "Arizona State University",
  "Boston University",
  "Brown University",
  "California Institute of Technology",
  "Carnegie Mellon University",
  "Columbia University",
  "Cornell University",
  "Duke University",
  "Georgia Institute of Technology",
  "Harvard University",
  "Imperial College London",
  "Indiana University Bloomington",
  "Johns Hopkins University",
  "Massachusetts Institute of Technology",
  "McGill University",
  "New York University",
  "Northwestern University",
  "Ohio State University",
  "Princeton University",
  "Purdue University",
  "Rice University",
  "Stanford University",
  "Texas A&M University",
  "University College London",
  "University of British Columbia",
  "University of California, Berkeley",
  "University of California, Los Angeles",
  "University of California, San Diego",
  "University of Cambridge",
  "University of Chicago",
  "University of Illinois Urbana-Champaign",
  "University of Michigan",
  "University of Oxford",
  "University of Pennsylvania",
  "University of Texas at Austin",
  "University of Toronto",
  "University of Washington",
  "University of Wisconsin-Madison",
  "Yale University",
];
