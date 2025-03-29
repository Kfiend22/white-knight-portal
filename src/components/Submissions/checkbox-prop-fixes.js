// This file contains the necessary fixes for the checkbox prop type errors
// Apply these changes to your Apps.js file where the warnings occur

/*
 * 1. Add this helper function at the top of your Apps.js file, near other utility functions
 */
const ensureBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
};

/*
 * 2. Replace the billingSame checkbox code with this:
 * 
 * FROM:
 * <FormControlLabel control={<Checkbox checked={(editingFields[application._id]?.billingSame ?? application.billingSame) === true || String(editingFields[application._id]?.billingSame ?? application.billingSame).toLowerCase() === 'true'} onChange={(e) => handleFieldEdit(application._id, 'billingSame', e.target.checked)} size="small"/>} label="Billing Same as Facility?" sx={{height: '30px'}}/>
 * 
 * TO:
 */
// <FormControlLabel
//   control={
//     <Checkbox 
//       checked={ensureBoolean(editingFields[application._id]?.billingSame ?? application.billingSame)}
//       onChange={(e) => handleFieldEdit(application._id, 'billingSame', e.target.checked)}
//       size="small"
//     />
//   }
//   label="Billing Same as Facility?"
//   sx={{height: '30px'}}
// />

/*
 * 3. Replace the billingSame conditional check with:
 * 
 * FROM:
 * {((editingFields[application._id]?.billingSame !== undefined ? editingFields[application._id]?.billingSame : application.billingSame) === false || String(editingFields[application._id]?.billingSame ?? application.billingSame).toLowerCase() === 'false') && (
 * 
 * TO:
 */
// {!ensureBoolean(editingFields[application._id]?.billingSame ?? application.billingSame) && (

/*
 * 4. Replace the ownership fields checkbox code with:
 * 
 * FROM:
 * {Object.keys(application.ownership || {}).map((key) => {
 *    const currentVal = (application.ownership || {})[key];
 *    const editedVal = editingFields[application._id]?.ownership?.[key];
 *    const valueToCheck = editedVal !== undefined ? editedVal : currentVal;
 *    // Make sure we handle both boolean and string values
 *    const isChecked = valueToCheck === true || (typeof valueToCheck === 'string' && valueToCheck.toLowerCase() === 'true');
 *    return (...);
 * })}
 * 
 * TO:
 */
// {Object.keys(application.ownership || {}).map((key) => {
//   const currentVal = (application.ownership || {})[key];
//   const editedVal = editingFields[application._id]?.ownership?.[key];
//   const valueToCheck = editedVal !== undefined ? editedVal : currentVal;
//   return (
//     <FormControlLabel 
//       key={key} 
//       control={
//         <Checkbox
//           checked={ensureBoolean(valueToCheck)}
//           onChange={(e) => handleFieldEdit(application._id, `ownership.${key}`, e.target.checked)}
//           size="small"
//         />
//       }
//       label={formatLabelName(key)} 
//       sx={{height: '30px'}}
//     />
//   );
// })}

/*
 * 5. Replace the agreements checkboxes with:
 * 
 * FROM:
 * <FormControlLabel control={<Checkbox checked={application.termsAgreement || false} disabled size="small"/>} label="Terms Agreement Signed" sx={{height: '30px'}}/>
 * <FormControlLabel control={<Checkbox checked={application.codeOfConductAgreement || false} disabled size="small"/>} label="Code of Conduct Signed" sx={{height: '30px'}}/>
 * 
 * TO:
 */
// <FormControlLabel
//   control={
//     <Checkbox 
//       checked={ensureBoolean(application.termsAgreement)}
//       disabled 
//       size="small"
//     />
//   }
//   label="Terms Agreement Signed" 
//   sx={{height: '30px'}}
// />
// <FormControlLabel
//   control={
//     <Checkbox 
//       checked={ensureBoolean(application.codeOfConductAgreement)}
//       disabled 
//       size="small"
//     />
//   }
//   label="Code of Conduct Signed" 
//   sx={{height: '30px'}}
// />

/*
 * 6. For service checkboxes in the map function, modify to:
 * 
 * FROM:
 * <Checkbox
 *   checked={isChecked}
 *   onChange={(e) => handleFieldEdit(application._id, `services.${key}`, e.target.checked)}
 *   name={key}
 *   size="small"
 * />
 * 
 * TO:
 */
// <Checkbox
//   checked={ensureBoolean(editingFields[application._id]?.services?.[key] ?? application.services?.[key] ?? false)}
//   onChange={(e) => handleFieldEdit(application._id, `services.${key}`, e.target.checked)}
//   name={key}
//   size="small"
// />
