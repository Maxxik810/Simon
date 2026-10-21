import './NavBar.css';

export type Screen = 'home' | 'about';

const ITEMS: ReadonlyArray<{ id: Screen; label: string }> = [
  { id: 'home', label: 'בית' },
  { id: 'about', label: 'אודות' },
];

type NavBarProps = {
  current: Screen;
  onNavigate: (screen: Screen) => void;
};

// Buttons (not links) so navigation never reloads the page or changes the URL.
export default function NavBar({ current, onNavigate }: NavBarProps) {
  return (
    <nav className="nav" aria-label="ניווט ראשי">
      <div className="nav__bar">
        {ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="nav__item"
            aria-current={current === item.id ? 'page' : undefined}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
