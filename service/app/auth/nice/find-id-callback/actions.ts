"use server";

import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { getSessionOptions } from "@/lib/session-config";

/**
 * Server Action to save NICE find-id session data
 * This must be a server action to use cookies() in Next.js App Router
 */
export async function saveFindIdSession(data: {
  redirectUrl: string;
  logData: any;
}) {
  try {
    const session = await getIronSession(cookies(), getSessionOptions());

    (session as any).findIdResult = data.redirectUrl;

    // Safe stringify: truncate decryptedData if too long (prevent cookie size limit)
    const logDataCopy = { ...data.logData };
    if (
      logDataCopy.decryptedData &&
      typeof logDataCopy.decryptedData === "string"
    ) {
      // Limit decryptedData to 500 chars for session storage
      if (logDataCopy.decryptedData.length > 500) {
        logDataCopy.decryptedData =
          logDataCopy.decryptedData.substring(0, 500) + "... (truncated)";
        console.log("Truncated decryptedData for session storage");
      }
    }

    // Truncate serverLogs if too many (keep last 20 entries to reduce size)
    if (logDataCopy.serverLogs && logDataCopy.serverLogs.length > 20) {
      logDataCopy.serverLogs = [
        `... (${logDataCopy.serverLogs.length - 20} earlier logs truncated)`,
        ...logDataCopy.serverLogs.slice(-20),
      ];
    }

    const jsonString = JSON.stringify(logDataCopy);
    const jsonLength = jsonString.length;
    console.log(
      `[${new Date().toISOString()}] Session data prepared:`,
      JSON.stringify({
        jsonLength,
        logsCount: logDataCopy.serverLogs?.length || 0,
      })
    );

    // Check if data is too large for cookies (max ~4KB)
    if (jsonLength > 3500) {
      console.warn(
        `⚠️ Session data too large (${jsonLength} bytes), truncating logs further...`
      );
      // Keep only last 5 logs if still too large
      logDataCopy.serverLogs = logDataCopy.serverLogs
        ? logDataCopy.serverLogs.slice(-5)
        : [];
      const reducedJsonString = JSON.stringify(logDataCopy);
      console.log(
        `Reduced to ${reducedJsonString.length} bytes with ${logDataCopy.serverLogs.length} logs`
      );
      (session as any).findIdLogData = reducedJsonString;
    } else {
      (session as any).findIdLogData = jsonString;
    }

    await session.save();
    console.log(`[${new Date().toISOString()}] ✅ Session saved successfully`);

    return { success: true };
  } catch (error: any) {
    const errorDetails = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      cause: error.cause,
    };
    console.error(
      `[${new Date().toISOString()}] ❌ Failed to save session:`,
      JSON.stringify(errorDetails, null, 2)
    );
    return {
      success: false,
      error: error.message,
      errorName: error.name,
    };
  }
}

/**
 * Server Action to get encryption keys from session
 */
export async function getEncryptionKeys() {
  try {
    const session = await getIronSession(cookies(), getSessionOptions());
    const { key, iv } = (session as any) || {};
    return { key, iv };
  } catch (error: any) {
    console.error("Failed to get encryption keys:", error);
    return { key: null, iv: null };
  }
}
