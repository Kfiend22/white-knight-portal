import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  Grid,
  Divider
} from '@mui/material';

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const ScheduleInput = ({ scheduleData = {}, onChange, disabled = false }) => {

  // Log the received scheduleData prop
  console.log('ScheduleInput - Received scheduleData:', JSON.stringify(scheduleData, null, 2));

  // Restored handleChange with mutual exclusivity logic
  const handleChange = (fieldPath, value, type) => {
    let finalValue = value;
    if (type === 'checkbox') {
      finalValue = value; // Use the boolean directly
    }

    // Construct the correct path before calling parent onChange
    // Keep 'open247' at the top level, nest others under 'schedule'
    const finalPath = fieldPath === 'open247' ? fieldPath : `schedule.${fieldPath}`;

    // Use the parent onChange to update the state with the correct path
    onChange(finalPath, finalValue);

    // Handle mutual exclusivity between sameEveryDay and sameTimeSelectedDays
    if (fieldPath === 'sameEveryDay' && finalValue === true) {
      onChange('schedule.sameTimeSelectedDays', false);
    } else if (fieldPath === 'sameTimeSelectedDays' && finalValue === true) {
      onChange('schedule.sameEveryDay', false);
    }
  };

  // Directly access values from scheduleData prop, using correct structure
  const open247 = scheduleData?.open247 ?? false; // Read open247 from top level
  const sameEveryDay = scheduleData?.sameEveryDay ?? false; // Read nested props directly
  const sameTimeSelectedDays = scheduleData?.sameTimeSelectedDays ?? false; // Read nested props directly

  return (
    <Box>
      <FormControlLabel
        control={
          <Checkbox
            checked={open247} // Use direct value
            onChange={(e) => handleChange('open247', e.target.checked, 'checkbox')}
            disabled={disabled}
            size="small"
          />
        }
        label="Open 24/7"
        sx={{ height: '30px' }}
      />

      {!open247 && (
        <Box sx={{ pl: 2, mt: 1, borderLeft: '2px solid #eee' }}>
          <Typography variant="subtitle2" gutterBottom>Detailed Hours</Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={sameEveryDay} // Use direct value
                // Pass path relative to schedule object to internal handleChange
                onChange={(e) => handleChange('sameEveryDay', e.target.checked, 'checkbox')}
                disabled={disabled}
                size="small"
              />
            }
            label="Same Time Every Day"
            sx={{ height: '30px' }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={sameTimeSelectedDays} // Use direct value
                 // Pass path relative to schedule object to internal handleChange
                onChange={(e) => handleChange('sameTimeSelectedDays', e.target.checked, 'checkbox')}
                disabled={disabled || sameEveryDay} // Disable if sameEveryDay is checked
                size="small"
              />
            }
            label="Same Time For Selected Days"
            sx={{ height: '30px' }}
          />

          {/* Conditional Time Inputs */}
          {sameEveryDay ? (
            // Single pair for everyday
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={6}>
                <TextField fullWidth label="Open Time (HH:MM)" type="time" size="small" margin="dense" InputLabelProps={{ shrink: true }}
                  value={scheduleData?.everyDayOpen ?? ''} // Read nested prop directly
                  onChange={(e) => handleChange('everyDayOpen', e.target.value)} // Pass relative path
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Close Time (HH:MM)" type="time" size="small" margin="dense" InputLabelProps={{ shrink: true }}
                  value={scheduleData?.everyDayClose ?? ''} // Read nested prop directly
                  onChange={(e) => handleChange('everyDayClose', e.target.value)} // Pass relative path
                  disabled={disabled}
                />
              </Grid>
            </Grid>
          ) : sameTimeSelectedDays ? (
             // Single pair + day checkboxes
             <>
               <Grid container spacing={1} alignItems="center" sx={{ mb: 1 }}>
                 <Grid item xs={6}>
                   <TextField fullWidth label="Open Time (HH:MM)" type="time" size="small" margin="dense" InputLabelProps={{ shrink: true }}
                     value={scheduleData?.everyDayOpen ?? ''} // Read nested prop directly
                     onChange={(e) => handleChange('everyDayOpen', e.target.value)} // Pass relative path
                     disabled={disabled}
                   />
                 </Grid>
                 <Grid item xs={6}>
                   <TextField fullWidth label="Close Time (HH:MM)" type="time" size="small" margin="dense" InputLabelProps={{ shrink: true }}
                     value={scheduleData?.everyDayClose ?? ''} // Read nested prop directly
                     onChange={(e) => handleChange('everyDayClose', e.target.value)} // Pass relative path
                     disabled={disabled}
                   />
                 </Grid>
               </Grid>
               <Divider sx={{ my: 1 }} />
               {daysOfWeek.map(day => (
                 <Box key={day} sx={{ mb: 1 }}>
                   <FormControlLabel
                     control={
                       <Checkbox
                         checked={scheduleData?.days?.[day]?.isOpen ?? false} // Read nested prop directly
                         onChange={(e) => handleChange(`days.${day}.isOpen`, e.target.checked, 'checkbox')} // Pass relative path
                         disabled={disabled}
                         size="small"
                       />
                     }
                     label={day.charAt(0).toUpperCase() + day.slice(1)} sx={{ height: '30px' }}
                   />
                 </Box>
               ))}
             </>
          ) : (
            // Individual day inputs
            daysOfWeek.map(day => (
              <Box key={day} sx={{ mb: 1 }}>
                 <FormControlLabel
                   control={
                     <Checkbox
                       checked={scheduleData?.days?.[day]?.isOpen ?? false} // Read nested prop directly
                       onChange={(e) => handleChange(`days.${day}.isOpen`, e.target.checked, 'checkbox')} // Pass relative path
                       disabled={disabled}
                       size="small"
                    />
                  }
                  label={day.charAt(0).toUpperCase() + day.slice(1)} sx={{ height: '30px', minWidth: '120px' }}
                />
                 {scheduleData?.days?.[day]?.isOpen && ( // Read nested prop directly
                   <Grid container spacing={1} alignItems="center" sx={{ display: 'inline-flex', width: 'calc(100% - 130px)', verticalAlign: 'middle' }}>
                     <Grid item xs={6}>
                       <TextField fullWidth label="Open" type="time" size="small" margin="none" InputLabelProps={{ shrink: true }}
                         value={scheduleData?.days?.[day]?.open ?? ''} // Read nested prop directly
                         onChange={(e) => handleChange(`days.${day}.open`, e.target.value)} // Pass relative path
                         disabled={disabled}
                       />
                     </Grid>
                     <Grid item xs={6}>
                       <TextField fullWidth label="Close" type="time" size="small" margin="none" InputLabelProps={{ shrink: true }}
                         value={scheduleData?.days?.[day]?.close ?? ''} // Read nested prop directly
                         onChange={(e) => handleChange(`days.${day}.close`, e.target.value)} // Pass relative path
                         disabled={disabled}
                       />
                    </Grid>
                  </Grid>
                )}
              </Box>
            ))
          )}
        </Box>
      )}
    </Box>
  );
};

export default ScheduleInput;
