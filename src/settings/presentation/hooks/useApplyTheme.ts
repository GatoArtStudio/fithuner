import { useEffect } from "react";
import { themeAttribute } from "../../domain/services/theme-attribute";
import { useSettings } from "../context/SettingsContext";

export function useApplyTheme() {
  const theme = useSettings((state) => state.settings.appearance.theme);

  useEffect(() => {
    const attribute = themeAttribute(theme);
    if (attribute) document.documentElement.setAttribute("data-theme", attribute);
    else document.documentElement.removeAttribute("data-theme");
  }, [theme]);
}
