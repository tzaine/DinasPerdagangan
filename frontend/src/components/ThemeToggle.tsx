import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "../store/themeStore";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useThemeStore();

    return (
        <button
            onClick={toggleTheme}
            className={`theme-toggle-btn ${theme === "dark" ? "btn-dark" : "btn-light"}`}
            aria-label="Toggle Theme"
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "1px solid var(--border-color, #e2e8f0)",
                background: "var(--bg-surface, #ffffff)",
                color: "var(--text-primary, #1e293b)",
                cursor: "pointer",
                transition: "all 0.2s ease",
            }}
        >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
    );
}
