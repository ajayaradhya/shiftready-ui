import * as Updates from "expo-updates";

export async function checkForOTAUpdate(): Promise<void> {
  if (!Updates.isEnabled || __DEV__) return;
  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } catch {
    // non-fatal — app continues with cached bundle
  }
}
