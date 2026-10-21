import './ScreenHeader.css';

type ScreenHeaderProps = {
  title: string;
};

export default function ScreenHeader({ title }: ScreenHeaderProps) {
  return (
    <header className="screen-header">
      {/* Decorative arch from the mockups */}
      <div className="screen-header__arch" aria-hidden="true" />
      <h1 className="screen-header__title">{title}</h1>
    </header>
  );
}
