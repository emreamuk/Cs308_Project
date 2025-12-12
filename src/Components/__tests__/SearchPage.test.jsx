import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchPage from '../Pages/Search/SearchPage';

describe('SearchPage Component', () => {
  it('should render search form', () => {
    render(<SearchPage />);

    expect(screen.getByRole('heading', { name: /search comics/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search for comics...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('should update search query on input change', () => {
    render(<SearchPage />);

    const input = screen.getByPlaceholderText('Search for comics...');
    fireEvent.change(input, { target: { value: 'Spider-Man' } });

    expect(input.value).toBe('Spider-Man');
  });

  it('should handle form submission', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    render(<SearchPage />);

    const input = screen.getByPlaceholderText('Search for comics...');
    const form = screen.getByRole('button', { name: /search/i }).closest('form');

    fireEvent.change(input, { target: { value: 'Batman' } });
    fireEvent.submit(form);

    expect(consoleSpy).toHaveBeenCalledWith('Searching for:', 'Batman');
    consoleSpy.mockRestore();
  });
});
