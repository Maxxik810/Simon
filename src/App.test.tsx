import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';

function getNav() {
  return screen.getByRole('navigation', { name: 'ניווט ראשי' });
}

describe('App – Milestone 1', () => {
  it('shows the home screen on load', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'סיימון' })).toBeInTheDocument();
    expect(screen.getByText('שלב 1 מתוך 10')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'התחל משחק' })).toBeInTheDocument();
    for (const name of ['ירוק', 'אדום', 'צהוב', 'כחול']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('places the four colors in the mockup positions', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: 'ירוק' })).toHaveAttribute('data-position', 'top-left');
    expect(screen.getByRole('button', { name: 'אדום' })).toHaveAttribute('data-position', 'top-right');
    expect(screen.getByRole('button', { name: 'צהוב' })).toHaveAttribute('data-position', 'bottom-left');
    expect(screen.getByRole('button', { name: 'כחול' })).toHaveAttribute('data-position', 'bottom-right');
  });

  it('has exactly two navigation buttons and no links', () => {
    render(<App />);
    const nav = getNav();
    const buttons = within(nav).getAllByRole('button');

    expect(buttons.map((b) => b.textContent)).toEqual(['בית', 'אודות']);
    expect(nav.querySelectorAll('a')).toHaveLength(0);
    expect(within(nav).getByRole('button', { name: 'בית' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('button', { name: 'אודות' })).not.toHaveAttribute('aria-current');
  });

  it('moves to the about screen and shows the explanation and empty history', () => {
    render(<App />);
    fireEvent.click(within(getNav()).getByRole('button', { name: 'אודות' }));

    expect(screen.getByRole('heading', { level: 1, name: 'אודות' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'על המשחק' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '10 המשחקים האחרונים' })).toBeInTheDocument();
    expect(screen.getByText('עדיין אין משחקים שמורים.')).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: 'ירוק' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'התחל משחק' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'מחק היסטוריה' })).not.toBeInTheDocument();
    expect(within(getNav()).getByRole('button', { name: 'אודות' })).toHaveAttribute('aria-current', 'page');
  });

  it('returns to the home screen', () => {
    render(<App />);
    fireEvent.click(within(getNav()).getByRole('button', { name: 'אודות' }));
    fireEvent.click(within(getNav()).getByRole('button', { name: 'בית' }));

    expect(screen.getByRole('heading', { level: 1, name: 'סיימון' })).toBeInTheDocument();
    expect(screen.getByText('שלב 1 מתוך 10')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ירוק' })).toBeInTheDocument();
  });
});
