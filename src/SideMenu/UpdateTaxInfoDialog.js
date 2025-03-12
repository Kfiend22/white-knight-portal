// UpdateTaxInfoDialog.js
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from '@mui/material';

function UpdateTaxInfoDialog({ open, onClose }) {
  const stateOptions = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 
    'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 
    'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 
    'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  // State for tax info fields
  const [taxInfo, setTaxInfo] = useState({
    businessClassification: '',
    ssnTin: '',
    businessName: '',
    w9Address: '',
    city: '',
    state: '',
    backupWithholding: false,
    electronicSignature: '',
  });

  // Handle input for SSN/EIN formatting (numbers only)
  const handleSsnTinChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Only allow digits

    if (value.length <= 9) {
      value = value.replace(/(\d{3})(\d{2})?(\d{4})?/, (match, p1, p2, p3) =>
        p3 ? `${p1}-${p2}-${p3}` : p2 ? `${p1}-${p2}` : p1
      ); // Format as SSN
    } else {
      value = value.replace(/(\d{2})(\d{7})/, '$1-$2'); // Format as EIN
    }

    setTaxInfo({ ...taxInfo, ssnTin: value });
  };

  // Handle input for City (letters only)
  const handleCityChange = (e) => {
    const value = e.target.value.replace(/[^a-zA-Z\s]/g, ''); // Only allow letters and spaces
    setTaxInfo({ ...taxInfo, city: value });
  };

  const handleUpdate = () => {
    // Handle updating tax info
    onClose(); // Close dialog after updating
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Update Tax Info</DialogTitle>
      <DialogContent>
        {/* Business Classification Drop-down */}
        <TextField
          select
          margin="dense"
          label="Business Classification"
          fullWidth
          value={taxInfo.businessClassification}
          onChange={(e) =>
            setTaxInfo({ ...taxInfo, businessClassification: e.target.value })
          }
        >
          {[
            'Individual',
            'Single-Member LLC',
            'Sole Proprietor',
            '(S) Corporation',
            '(C) Corporation',
            'Partnership',
            'Trust/Estate',
            'Other',
          ].map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        {/* Social Security/EIN Field (numbers only) */}
        <TextField
          margin="dense"
          label="Social Security/EIN"
          fullWidth
          value={taxInfo.ssnTin}
          onChange={handleSsnTinChange}
        />

        {/* Name or Business Name Field */}
        <TextField
          margin="dense"
          label="Name or Business Name (As Shown On Income Tax Return)"
          fullWidth
          value={taxInfo.businessName}
          onChange={(e) =>
            setTaxInfo({ ...taxInfo, businessName: e.target.value })
          }
        />

        {/* Address on W9 Form Field */}
        <TextField
          margin="dense"
          label="Address On Your W9 Form"
          fullWidth
          value={taxInfo.w9Address}
          onChange={(e) =>
            setTaxInfo({ ...taxInfo, w9Address: e.target.value })
          }
        />

        {/* City Field (letters only) */}
        <TextField
          margin="dense"
          label="City"
          fullWidth
          value={taxInfo.city}
          onChange={handleCityChange}
        />

        {/* State Drop-down */}
        <TextField
          select
          margin="dense"
          label="State"
          fullWidth
          value={taxInfo.state}
          onChange={(e) => setTaxInfo({ ...taxInfo, state: e.target.value })}
        >
          {stateOptions.map((state) => (
            <MenuItem key={state} value={state}>
              {state}
            </MenuItem>
          ))}
        </TextField>

        {/* Backup Withholding Checkbox */}
        <FormControlLabel
          control={
            <Checkbox
              checked={taxInfo.backupWithholding}
              onChange={(e) =>
                setTaxInfo({ ...taxInfo, backupWithholding: e.target.checked })
              }
            />
          }
          label="I certify that I am not subject to backup withholding"
        />

        {/* Electronic Signature Field */}
        <TextField
          margin="dense"
          label="Electronic Signature"
          fullWidth
          value={taxInfo.electronicSignature}
          onChange={(e) =>
            setTaxInfo({ ...taxInfo, electronicSignature: e.target.value })
          }
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleUpdate} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default UpdateTaxInfoDialog;
