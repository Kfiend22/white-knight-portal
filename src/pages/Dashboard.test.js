import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';

test('renders Dashboard component', () => {
  render(<Dashboard />);
  const dashboardTitle = screen.getByText(/Dashboard/i);
  expect(dashboardTitle).toBeInTheDocument();
});

test('renders tabs for job statuses', () => {
  render(<Dashboard />);
  const activeJobsTab = screen.getByText(/Active Jobs/i);
  const completedJobsTab = screen.getByText(/Completed Jobs/i);
  const canceledJobsTab = screen.getByText(/Canceled Jobs/i);
  expect(activeJobsTab).toBeInTheDocument();
  expect(completedJobsTab).toBeInTheDocument();
  expect(canceledJobsTab).toBeInTheDocument();
});
