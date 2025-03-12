// Performance.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Paper,
  Grid,
  CircularProgress,
  Snackbar,
  List as MuiList,
  ListItem as MuiListItem,
  ListItemText as MuiListItemText,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  Tooltip,
  TextField,
  useMediaQuery,
  Typography,
  Checkbox,
  ListItemText,
  Button,
} from '@mui/material';
import {
  Info as InfoIcon,
} from '@mui/icons-material';
import { Line, Pie, Bar } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import dayjs from 'dayjs';
import SideMenu from '../components/SideMenu'; // <-- Import SideMenu

function Performance() {
  const isSmallScreen = useMediaQuery('(max-width:600px)');

  // State variables
  const [metrics, setMetrics] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [reviewFilter, setReviewFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState([]); // List of all locations
  const [selectedLocations, setSelectedLocations] = useState([]); // Locations selected by user

  // Sample data
  const sampleData = [
    {
      location: 'New York',
      customerRates: 8.2,
      completionRate: 90,
      acceptanceRate: 85,
      locationService: 95,
      photoCapture: 80,
      totalJobs: 80,
      totalEarnings: 2400.5,
      averageResponseTime: 16,
      serviceTypeBreakdown: {
        Towing: 35,
        'Jump Start': 25,
        'Tire Change': 20,
        'Fuel Delivery': 10,
        Lockout: 10,
      },
      performanceOverTime: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        completionRate: [88, 90, 92, 90],
        acceptanceRate: [83, 85, 86, 84],
        totalEarnings: [600, 650, 550, 600],
      },
      reviews: [
        { id: 1, rating: 9, comment: 'Great service in New York!' },
        { id: 2, rating: 8, comment: 'Prompt and professional.' },
      ],
    },
    {
      location: 'Los Angeles',
      customerRates: 8.8,
      completionRate: 94,
      acceptanceRate: 88,
      locationService: 97,
      photoCapture: 85,
      totalJobs: 70,
      totalEarnings: 2100.25,
      averageResponseTime: 14,
      serviceTypeBreakdown: {
        Towing: 45,
        'Jump Start': 15,
        'Tire Change': 15,
        'Fuel Delivery': 15,
        Lockout: 10,
      },
      performanceOverTime: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        completionRate: [92, 94, 96, 94],
        acceptanceRate: [86, 88, 89, 87],
        totalEarnings: [500, 550, 550, 500],
      },
      reviews: [
        { id: 3, rating: 10, comment: 'Excellent experience!' },
        { id: 4, rating: 7, comment: 'Good service, but can improve timing.' },
      ],
    },
    {
      location: 'Chicago',
      customerRates: 8.5,
      completionRate: 92,
      acceptanceRate: 87,
      locationService: 96,
      photoCapture: 82,
      totalJobs: 60,
      totalEarnings: 1800.0,
      averageResponseTime: 15,
      serviceTypeBreakdown: {
        Towing: 40,
        'Jump Start': 20,
        'Tire Change': 20,
        'Fuel Delivery': 10,
        Lockout: 10,
      },
      performanceOverTime: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        completionRate: [90, 92, 94, 92],
        acceptanceRate: [85, 87, 88, 86],
        totalEarnings: [400, 500, 450, 450],
      },
      reviews: [
        { id: 5, rating: 4, comment: 'Not satisfied with the response time.' },
        { id: 6, rating: 9, comment: 'Very helpful and courteous.' },
      ],
    },
  ];

  // Load sample data on component mount
  useEffect(() => {
    loadSampleData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load sample data
  const loadSampleData = () => {
    // Set locations
    const locationNames = sampleData.map((data) => data.location);
    setLocations(locationNames);
    // Default selected locations (all)
    setSelectedLocations(locationNames);

    // Combine data for all locations
    const combinedData = combineData(sampleData, locationNames);
    setMetrics(combinedData.metrics);
    setReviews(combinedData.reviews);

    // Set loading to false after data is loaded
    setLoading(false);
  };

  // Combine data based on selected locations
  const combineData = (dataArray, selectedLocs) => {
    const filteredData = dataArray.filter((data) => selectedLocs.includes(data.location));

    // Initialize combined metrics
    let totalCustomerRates = 0;
    let totalCompletionRate = 0;
    let totalAcceptanceRate = 0;
    let totalLocationService = 0;
    let totalPhotoCapture = 0;
    let totalJobs = 0;
    let totalEarnings = 0;
    let totalResponseTime = 0;

    const serviceTypeTotals = {};
    const performanceOverTime = {
      labels: filteredData[0]?.performanceOverTime.labels || [],
      completionRate: [],
      acceptanceRate: [],
      totalEarnings: [],
    };

    let combinedReviews = [];

    filteredData.forEach((data) => {
      const weight = data.totalJobs;

      totalCustomerRates += data.customerRates * weight;
      totalCompletionRate += data.completionRate * weight;
      totalAcceptanceRate += data.acceptanceRate * weight;
      totalLocationService += data.locationService * weight;
      totalPhotoCapture += data.photoCapture * weight;
      totalResponseTime += data.averageResponseTime * weight;
      totalJobs += data.totalJobs;
      totalEarnings += data.totalEarnings;

      // Combine service type breakdown
      Object.entries(data.serviceTypeBreakdown).forEach(([type, value]) => {
        serviceTypeTotals[type] = (serviceTypeTotals[type] || 0) + value;
      });

      // Combine performance over time
      data.performanceOverTime.completionRate.forEach((value, index) => {
        performanceOverTime.completionRate[index] =
          (performanceOverTime.completionRate[index] || 0) + value * weight;
      });
      data.performanceOverTime.acceptanceRate.forEach((value, index) => {
        performanceOverTime.acceptanceRate[index] =
          (performanceOverTime.acceptanceRate[index] || 0) + value * weight;
      });
      data.performanceOverTime.totalEarnings.forEach((value, index) => {
        performanceOverTime.totalEarnings[index] =
          (performanceOverTime.totalEarnings[index] || 0) + value;
      });

      // Combine reviews
      combinedReviews = combinedReviews.concat(data.reviews);
    });

    // Calculate weighted averages
    const metrics = {
      customerRates: totalCustomerRates / totalJobs,
      completionRate: totalCompletionRate / totalJobs,
      acceptanceRate: totalAcceptanceRate / totalJobs,
      locationService: totalLocationService / totalJobs,
      photoCapture: totalPhotoCapture / totalJobs,
      totalJobs,
      totalEarnings,
      averageResponseTime: totalResponseTime / totalJobs,
      serviceTypeBreakdown: {
        labels: Object.keys(serviceTypeTotals),
        data: Object.values(serviceTypeTotals),
      },
      performanceOverTime: {
        labels: performanceOverTime.labels,
        completionRate: performanceOverTime.completionRate.map((value) => value / totalJobs),
        acceptanceRate: performanceOverTime.acceptanceRate.map((value) => value / totalJobs),
        totalEarnings: performanceOverTime.totalEarnings,
      },
    };

    return { metrics, reviews: combinedReviews };
  };

  // Handle location selection change
  const handleLocationChange = (event) => {
    const {
      target: { value },
    } = event;
    const selected = typeof value === 'string' ? value.split(',') : value;
    setSelectedLocations(selected.length ? selected : []);

    // Update metrics based on selected locations
    const combinedData = combineData(
      sampleData,
      selected.length ? selected : [] // If no locations selected, show no data
    );
    setMetrics(combinedData.metrics);
    setReviews(combinedData.reviews);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Handle review filter change
  const handleReviewFilterChange = (event) => {
    setReviewFilter(event.target.value);
  };

  // Filtered reviews
  const filteredReviews = reviews.filter((review) => {
    if (reviewFilter === 'All') return true;
    if (reviewFilter === 'Positive') return review.rating >= 8;
    if (reviewFilter === 'Neutral') return review.rating >= 5 && review.rating < 8;
    if (reviewFilter === 'Negative') return review.rating < 5;
    return true;
  });

  // Search reviews
  const searchedReviews = filteredReviews.filter((review) =>
    review.comment.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle date range change (not functional without backend)
  const handleDateRangeChange = () => {
    // For sample data, this function does not change data
    // In a real scenario, you would fetch new data based on the date range
    setSnackbarMessage('Date range selection is disabled in sample data.');
    setSnackbarOpen(true);
  };

  return (
    <>
      {/* Side Menu */}
      <SideMenu />

      {/* Main Content */}
      <Container maxWidth="lg">
        <Box mt={4} mb={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">Performance</Typography>
          <Box display="flex" alignItems="center">
            {/* Location Filter */}
            <FormControl sx={{ minWidth: 200, mr: 2 }} size="small">
              <InputLabel>Locations</InputLabel>
              <Select
                multiple
                value={selectedLocations}
                onChange={handleLocationChange}
                renderValue={(selected) => (selected.length ? selected.join(', ') : 'All Locations')}
                label="Locations"
              >
                {locations.map((location) => (
                  <MenuItem key={location} value={location}>
                    <Checkbox checked={selectedLocations.indexOf(location) > -1} />
                    <ListItemText primary={location} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {/* Date Range Picker Placeholder */}
            <Button variant="outlined" onClick={handleDateRangeChange}>
              Select Date Range
            </Button>
          </Box>
        </Box>
        {loading && (
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress />
          </Box>
        )}
        {!loading && metrics && (
          <Grid container spacing={4}>
            {/* Performance Metrics */}
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ padding: 2 }}>
                <Tooltip title="Average rating provided by customers (1-10)">
                  <Typography variant="h6">
                    Customer Rates <InfoIcon fontSize="small" />
                  </Typography>
                </Tooltip>
                <Typography variant="h3" aria-label="Customer Rates">
                  {metrics.customerRates.toFixed(1)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ padding: 2 }}>
                <Tooltip title="Percentage of successfully completed calls">
                  <Typography variant="h6">
                    Completion Rate <InfoIcon fontSize="small" />
                  </Typography>
                </Tooltip>
                <Typography variant="h3" aria-label="Completion Rate">
                  {metrics.completionRate.toFixed(1)}%
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ padding: 2 }}>
                <Tooltip title="Percentage of calls accepted">
                  <Typography variant="h6">
                    Acceptance Rate <InfoIcon fontSize="small" />
                  </Typography>
                </Tooltip>
                <Typography variant="h3" aria-label="Acceptance Rate">
                  {metrics.acceptanceRate.toFixed(1)}%
                </Typography>
              </Paper>
            </Grid>
            {/* Additional Metrics */}
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ padding: 2 }}>
                <Tooltip title="Percentage of time drivers were traceable via GPS">
                  <Typography variant="h6">
                    Location Service <InfoIcon fontSize="small" />
                  </Typography>
                </Tooltip>
                <Typography variant="h3" aria-label="Location Service">
                  {metrics.locationService.toFixed(1)}%
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ padding: 2 }}>
                <Tooltip title="Percentage of calls with photos uploaded">
                  <Typography variant="h6">
                    Photo Capture <InfoIcon fontSize="small" />
                  </Typography>
                </Tooltip>
                <Typography variant="h3" aria-label="Photo Capture">
                  {metrics.photoCapture.toFixed(1)}%
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ padding: 2 }}>
                <Tooltip title="Number of calls successfully serviced">
                  <Typography variant="h6">
                    Total Jobs <InfoIcon fontSize="small" />
                  </Typography>
                </Tooltip>
                <Typography variant="h3" aria-label="Total Jobs">
                  {metrics.totalJobs}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ padding: 2 }}>
                <Tooltip title="Total dollar amount earned">
                  <Typography variant="h6">
                    Total Earnings <InfoIcon fontSize="small" />
                  </Typography>
                </Tooltip>
                <Typography variant="h3" aria-label="Total Earnings">
                  ${metrics.totalEarnings.toFixed(2)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ padding: 2 }}>
                <Tooltip title="Average time to reach customers after accepting a call">
                  <Typography variant="h6">
                    Average Response Time <InfoIcon fontSize="small" />
                  </Typography>
                </Tooltip>
                <Typography variant="h3" aria-label="Average Response Time">
                  {metrics.averageResponseTime.toFixed(1)} mins
                </Typography>
              </Paper>
            </Grid>
            {/* Service Type Breakdown */}
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ padding: 2 }}>
                <Typography variant="h6">Service Type Breakdown</Typography>
                <Pie
                  data={{
                    labels: metrics.serviceTypeBreakdown.labels,
                    datasets: [
                      {
                        data: metrics.serviceTypeBreakdown.data,
                        backgroundColor: [
                          '#FF6384',
                          '#36A2EB',
                          '#FFCE56',
                          '#4BC0C0',
                          '#9966FF',
                        ],
                      },
                    ],
                  }}
                  options={{
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: (tooltipItem) => {
                            const label =
                              metrics.serviceTypeBreakdown.labels[tooltipItem.dataIndex];
                            const value =
                              metrics.serviceTypeBreakdown.data[tooltipItem.dataIndex];
                            return `${label}: ${value}%`;
                          },
                        },
                      },
                    },
                  }}
                />
              </Paper>
            </Grid>
            {/* Performance Over Time */}
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ padding: 2 }}>
                <Typography variant="h6">Performance Over Time</Typography>
                <Line
                  data={{
                    labels: metrics.performanceOverTime.labels,
                    datasets: [
                      {
                        label: 'Completion Rate',
                        data: metrics.performanceOverTime.completionRate,
                        fill: false,
                        backgroundColor: 'rgba(75,192,192,0.4)',
                        borderColor: 'rgba(75,192,192,1)',
                        tension: 0.1,
                      },
                      {
                        label: 'Acceptance Rate',
                        data: metrics.performanceOverTime.acceptanceRate,
                        fill: false,
                        backgroundColor: 'rgba(153,102,255,0.4)',
                        borderColor: 'rgba(153,102,255,1)',
                        tension: 0.1,
                      },
                    ],
                  }}
                  options={{
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: (context) =>
                            `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`,
                        },
                      },
                    },
                    interaction: {
                      mode: 'index',
                      intersect: false,
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          callback: (value) => `${value}%`,
                        },
                      },
                    },
                  }}
                />
              </Paper>
            </Grid>
            {/* Earnings Over Time */}
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ padding: 2 }}>
                <Typography variant="h6">Earnings Over Time</Typography>
                <Bar
                  data={{
                    labels: metrics.performanceOverTime.labels,
                    datasets: [
                      {
                        label: 'Total Earnings',
                        data: metrics.performanceOverTime.totalEarnings,
                        backgroundColor: 'rgba(54,162,235,0.6)',
                        borderColor: 'rgba(54,162,235,1)',
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: (context) => `$${context.parsed.y.toFixed(2)}`,
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </Paper>
            </Grid>

            {/* Customer Reviews */}
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ padding: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">Customer Reviews</Typography>
                  <Box display="flex" alignItems="center" flexWrap="wrap">
                    <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
                      <InputLabel>Filter</InputLabel>
                      <Select
                        value={reviewFilter}
                        label="Filter"
                        onChange={handleReviewFilterChange}
                      >
                        <MenuItem value="All">All</MenuItem>
                        <MenuItem value="Positive">Positive</MenuItem>
                        <MenuItem value="Neutral">Neutral</MenuItem>
                        <MenuItem value="Negative">Negative</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      size="small"
                      placeholder="Search Reviews"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </Box>
                </Box>
                <MuiList sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {searchedReviews.length > 0 ? (
                    searchedReviews.map((review) => (
                      <MuiListItem key={review.id} alignItems="flex-start">
                        <MuiListItemText
                          primary={`Rating: ${review.rating} / 10`}
                          secondary={review.comment}
                        />
                      </MuiListItem>
                    ))
                  ) : (
                    <Typography>No reviews found.</Typography>
                  )}
                </MuiList>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </>
  );
}

export default Performance;
