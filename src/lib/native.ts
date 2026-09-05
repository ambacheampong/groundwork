export async function isCapacitor(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const { Capacitor } = await import("@capacitor/core");
  return Capacitor.isNativePlatform();
}

export async function pickNativePhoto(): Promise<File | null> {
  const capacitor = await isCapacitor();
  if (!capacitor) return null;

  const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.Uri,
    source: CameraSource.Prompt,
  });

  if (!photo.webPath) return null;

  const res = await fetch(photo.webPath);
  const blob = await res.blob();
  const name = photo.path?.split("/").pop() || `photo-${Date.now()}.jpg`;
  return new File([blob], name, { type: blob.type || "image/jpeg" });
}

export async function saveNativeSession(key: string, value: string): Promise<void> {
  if (typeof window === "undefined") return;
  const capacitor = await isCapacitor();
  if (!capacitor) {
    localStorage.setItem(key, value);
    return;
  }
  const { Preferences } = await import("@capacitor/preferences");
  await Preferences.set({ key, value });
}

export async function loadNativeSession(key: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const capacitor = await isCapacitor();
  if (!capacitor) return localStorage.getItem(key);
  const { Preferences } = await import("@capacitor/preferences");
  const { value } = await Preferences.get({ key });
  return value;
}
