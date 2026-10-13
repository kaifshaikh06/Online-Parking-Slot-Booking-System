import { useTheme } from "../context/ThemeContext";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      <span aria-hidden="true">{isDark ? "☀" : "☾"}</span>
      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
};

export default ThemeToggle;
