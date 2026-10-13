import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

const readStoredTheme = () => {
  const savedTheme = localStorage.getItem("parkingTheme");
  return savedTheme === "dark" ? "dark" : "light";
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(readStoredTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("parkingTheme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
