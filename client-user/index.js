// index.js
import { registerRootComponent } from "expo";
import * as SplashScreen from "expo-splash-screen";
import "./src/shared/ui/setupFonts.js";
import App from "./App.jsx";

SplashScreen.preventAutoHideAsync().catch(() => {});

registerRootComponent(App);
