// JobInvoice.js
import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Grid
} from '@mui/material';

const JobInvoice = ({ job }) => {
  if (!job) return null;

  // Calculate service costs based on job details
  // This is a placeholder implementation - in a real system, these values would likely
  // come from a rate calculation service or be stored with the job
  const calculateInvoiceItems = () => {
    const items = [];
    
    // Add base service charge
    items.push({
      description: `Service: ${job.service}`,
      quantity: 1,
      rate: 85.00, // Placeholder base rate
      amount: 85.00
    });

    // Add vehicle class surcharge if applicable
    if (job.classType) {
      let classSurcharge = 0;
      switch(job.classType) {
        case 'Class A':
          classSurcharge = 50.00;
          break;
        case 'Class B':
          classSurcharge = 35.00;
          break;
        case 'Class C':
          classSurcharge = 20.00;
          break;
        default:
          classSurcharge = 0;
      }
      
      if (classSurcharge > 0) {
        items.push({
          description: `${job.classType} Surcharge`,
          quantity: 1,
          rate: classSurcharge,
          amount: classSurcharge
        });
      }
    }

    // Add mileage charges (en route and loaded)
    // In a real implementation, these would be calculated from actual distances
    const enRouteMiles = 15; // Placeholder
    const loadedMiles = 25; // Placeholder
    
    items.push({
      description: 'En Route Miles',
      quantity: enRouteMiles,
      rate: 2.50,
      amount: enRouteMiles * 2.50
    });
    
    items.push({
      description: 'Loaded Miles',
      quantity: loadedMiles,
      rate: 3.50,
      amount: loadedMiles * 3.50
    });

    // Add any additional charges based on job status or details
    if (job.status === 'Completed') {
      // Example: Add completion bonus
      items.push({
        description: 'Completion Bonus',
        quantity: 1,
        rate: 20.00,
        amount: 20.00
      });
    }

    // Add time-based charges if applicable
    const waitingTime = 0.5; // Placeholder: half an hour wait time
    if (waitingTime > 0) {
      items.push({
        description: 'Waiting Time',
        quantity: waitingTime,
        rate: 35.00,
        amount: waitingTime * 35.00
      });
    }

    return items;
  };

  const invoiceItems = calculateInvoiceItems();
  
  // Calculate total
  const total = invoiceItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Box margin={2} sx={{ boxShadow: 1, borderRadius: 1, overflow: 'hidden' }}>
      <Paper sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Job Invoice
          </Typography>
          <Typography variant="subtitle1">
            Invoice #: {job.po || job.id}
          </Typography>
        </Box>
        
        {/* Job Basic Details */}
        <Box mb={3}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">Customer</Typography>
              <Typography variant="body1">{job.customerName}</Typography>
              <Typography variant="body2">{job.customerPhone}</Typography>
              {job.customerEmail && <Typography variant="body2">{job.customerEmail}</Typography>}
            </Grid>
            <Grid item xs={6} textAlign="right">
              <Typography variant="subtitle2" color="text.secondary">Service Address</Typography>
              <Typography variant="body1">
                {job.serviceLocation && typeof job.serviceLocation === 'object' 
                  ? `${job.serviceLocation.street}, ${job.serviceLocation.city}, ${job.serviceLocation.state} ${job.serviceLocation.zip}` 
                  : (job.serviceLocation || job.location)}
              </Typography>
            </Grid>
          </Grid>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Invoice Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Rate</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoiceItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">${item.rate.toFixed(2)}</TableCell>
                  <TableCell align="right">${item.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              
              {/* Total Row */}
              <TableRow>
                <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                  Total
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  ${total.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box mt={3}>
          <Typography variant="subtitle2" gutterBottom>Notes:</Typography>
          <Typography variant="body2" color="text.secondary">
            This invoice is based on standard rates and may be subject to adjustment.
            Please contact billing department for any questions.
          </Typography>
        </Box>
        
        {/* Payment Status */}
        <Box mt={2} p={1} bgcolor={job.paymentSubmitted ? 'success.light' : 'warning.light'} borderRadius={1}>
          <Typography variant="body2" color="text.secondary">
            Payment Status: {job.paymentSubmitted ? 'Submitted' : 'Pending'}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default JobInvoice;
