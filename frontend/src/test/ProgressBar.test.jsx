import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProgressBar from '../components/common/ProgressBar';

describe('ProgressBar Component & Calculation Edge Cases', () => {
  it('renders percentage accurately for normal inputs', () => {
    render(<ProgressBar value={50} max={100} showLabel labelText="Test Progress" />);
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('Test Progress')).toBeInTheDocument();
  });

  it('handles division by zero without producing NaN or Infinity', () => {
    render(<ProgressBar value={50} max={0} showLabel labelText="Zero Max" />);
    const pctElement = screen.getByText('0%');
    expect(pctElement).toBeInTheDocument();
    expect(screen.queryByText(/NaN/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Infinity/i)).not.toBeInTheDocument();
  });

  it('clamps negative values to 0%', () => {
    render(<ProgressBar customPercentage={-25} showLabel />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('clamps values above 100 to 100%', () => {
    render(<ProgressBar customPercentage={150} showLabel />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('handles null and undefined values safely', () => {
    render(<ProgressBar value={null} max={null} showLabel />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('handles NaN custom percentage safely', () => {
    render(<ProgressBar customPercentage={NaN} showLabel />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('sets correct accessibility attributes', () => {
    render(<ProgressBar value={75} max={100} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '75');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });
});
