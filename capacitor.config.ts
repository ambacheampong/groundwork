import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.groundwork.mobile",
  appName: "Groundwork",
  webDir: "mobile-web",
  server: {
    // TODO: replace with your real deployed URL once you've deployed to Vercel
    // (e.g. "https://groundwork.vercel.app" or "https://www.groundwork.com" once
    // you've bought and connected the domain).
    url: "https://groundwork.vercel.app",
    cleartext: false,
    allowNavigation: ["vercel.app", "*.vercel.app", "groundwork.com", "*.groundwork.com"],
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#F7F3EF",
    preferredContentMode: "mobile",
  },
  android: {
    backgroundColor: "#F7F3EF",
    allowMixedContent: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
