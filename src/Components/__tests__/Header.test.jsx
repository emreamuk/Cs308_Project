import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from '../Header/Header';

describe('Header Component', () => {
  it('should display hero content', () => {
    render(<Header />);

    // Check if main heading is displayed
    expect(screen.getByRole('heading', { name: /comics/i })).toBeInTheDocument();

    // Check if button is displayed
    expect(screen.getByRole('button', { name: /start reading/i })).toBeInTheDocument();
  });

  it('should render the header container', () => {
    const { container } = render(<Header />);

    // Check if main container has correct class
    const headerDiv = container.querySelector('.header');
    expect(headerDiv).toBeInTheDocument();

    // Check if contents container exists
    const headerContents = container.querySelector('.header-contents');
    expect(headerContents).toBeInTheDocument();
  });
});
