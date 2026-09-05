import { isCapacitor } from "@/lib/native";
import { savePushToken } from "@/lib/push.functions";

let registered = false;

export async function registerPushNotifications(): Promise<void> {
  if (registered) return;
  if (!(await isCapacitor())) return;

  const { PushNotifications } = await import("@capacitor/push-notifications");
  const { Capacitor } = await import("@capacitor/core");

  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== "granted") return;

  await PushNotifications.register();
  registered = true;

  PushNotifications.addListener("registration", async (token) => {
    await savePushToken({ data: { token: token.value, platform: Capacitor.getPlatform() } });
  });

  PushNotifications.addListener("registrationError", (err) => {
    console.error("Push registration failed", err);
  });

  PushNotifications.addListener("pushNotificationReceived", (notification) => {
    // The native OS banner is shown automatically; this is for in-app handling.
    console.log("Push received", notification);
  });

  PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const route = action.notification.data?.route as string | undefined;
    if (route && typeof window !== "undefined") {
      window.location.href = route;
    }
  });
}

