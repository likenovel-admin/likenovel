import axios from "axios";
import crypto from "crypto";
import iconv from "iconv-lite";
import { redirect } from "next/navigation";
import { getEncryptionKeys } from "./actions";

/**
 * NICE 본인인증 콜백 - Find ID
 * Server component processes data and redirects to result page
 */
export default async function NiceFindIdCallback({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  console.log("NICE 본인인증 콜백 - Find ID");

  // Get encryption keys from session via Server Action
  const { key, iv } = await getEncryptionKeys();
  const encData = searchParams["enc_data"] as string;
  const tokenVersionId = searchParams["token_version_id"] as string;
  const integrityValue = searchParams["integrity_value"] as string;

  let redirectUrl = "/find-id-fail";
  let logData = {
    hasEncData: !!encData,
    hasKey: !!key,
    hasIv: !!iv,
    decryptedData: null as any,
    niceData: null as any,
    error: null as any,
    serverLogs: [] as string[], // Add server logs array for browser visibility
  };

  // Helper to add log (will be visible in browser via session)
  const addLog = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = data
      ? `[${timestamp}] ${message}: ${JSON.stringify(data)}`
      : `[${timestamp}] ${message}`;
    logData.serverLogs.push(logEntry);
    console.log(logEntry); // Still log to server for deployment logs
  };

  addLog("NICE Find-ID Callback started");
  addLog("Search params", {
    hasEncData: !!encData,
    hasKey: !!key,
    hasIv: !!iv,
  });

  if (!encData || !key || !iv) {
    addLog("❌ ERROR: Missing encryption data or key or iv");
    logData.error = "Missing encryption data or key or iv";
  } else {
    try {
      addLog("Starting NICE data decryption");
      // Decrypt NICE data
      const decrypted = crypto.createDecipheriv(
        "aes-128-cbc",
        Buffer.from(key),
        Buffer.from(iv)
      );
      let decryptedData = decrypted.update(encData, "base64", "binary");
      decryptedData += decrypted.final("binary");

      // 'binary'에서 'euc-kr'로 디코딩
      decryptedData = iconv.decode(
        Buffer.from(decryptedData, "binary"),
        "euc-kr"
      );

      addLog("✅ Decryption successful", { length: decryptedData.length });

      // Store decryptedData for client-side logging
      logData.decryptedData = decryptedData;

      // Parse NICE response data
      const parseNiceData = (data: string): Record<string, string> => {
        const result: Record<string, string> = {};
        const cleaned = data.replace(/^\{|\}$/g, "").trim();
        const pairs = cleaned.split('","');

        pairs.forEach((pair) => {
          const [key, ...valueParts] = pair.split('":"');
          const cleanKey = key.replace(/^"|"/g, "");
          const cleanValue = valueParts.join('":"').replace(/^"|"$/g, "");
          if (cleanKey && cleanValue !== undefined) {
            result[cleanKey] = cleanValue;
          }
        });

        return result;
      };

      const niceData = parseNiceData(decryptedData);

      // Extract user information
      const name = niceData.name || niceData.utf8_name || "";
      const birthdate = niceData.birthdate || "";
      const mobileno = niceData.mobileno || "";
      const gender = niceData.gender || "";
      const di = niceData.di || "";
      const ci = niceData.ci || "";

      addLog("✅ Parsed NICE data", {
        name,
        birthdate,
        mobileno,
        gender,
      });

      logData.niceData = { name, birthdate, mobileno, gender };

      // Call backend API to find user by identity
      try {
        // Convert NICE gender format to API format
        // NICE: "1" = Male, "2" = Female
        // API: "M" = Male, "F" = Female
        const genderMap: { [key: string]: string } = {
          "1": "M",
          "2": "F",
        };
        const apiGender = genderMap[gender] || "M";

        // Convert birthdate format: YYYYMMDD → YYYY-MM-DD
        const formattedBirthdate = `${birthdate.substring(
          0,
          4
        )}-${birthdate.substring(4, 6)}-${birthdate.substring(6, 8)}`;

        addLog("Calling backend API to find email", {
          user_name: name,
          birthdate: formattedBirthdate,
          gender: apiGender,
        });

        const response = await axios.post(
          `${process.env.API_SERVER_URI}/v1/command/auth/identity/account/search`,
          {
            user_name: name,
            birthdate: formattedBirthdate,
            gender: apiGender,
          },
          {
            headers: {
              "Content-Type": "application/json",
              accept: "application/json",
            },
          }
        );

        addLog("✅ Backend API response received", {
          data: response.data,
          hasData: !!response.data,
          hasEmail: !!response.data?.data?.email,
          hasMaskedEmail: !!response.data?.data?.masked_email,
        });

        // API returns: { data: { email, masked_email, signUpType } }
        // Priority: Use masked_email for display (security), fallback to email
        const displayEmail =
          response.data?.data?.masked_email || response.data?.data?.email;

        if (displayEmail) {
          addLog("✅ User found with email", {
            hasMaskedEmail: !!response.data?.data?.masked_email,
            hasEmail: !!response.data?.data?.email,
            displayEmail: displayEmail,
          });
          redirectUrl = `/find-id-ok?email=${encodeURIComponent(displayEmail)}`;
        } else {
          addLog("❌ No email found in response, user not found");
          logData.error = "User not found";
          redirectUrl = "/find-id-fail";
        }
      } catch (error: any) {
        addLog("❌ Backend API error", {
          message: error.response?.data?.message || error.message,
          status: error.response?.status,
        });
        logData.error =
          "Backend API error: " +
          (error.response?.data?.message || error.message || "Unknown");
        redirectUrl = "/find-id-fail";
      }
    } catch (error: any) {
      addLog("❌ Decryption error", { message: error.message });
      logData.error = "Decryption error: " + (error.message || "Unknown");
      redirectUrl = "/find-id-fail";
    }
  }

  // // Validate redirectUrl before saving
  // if (!redirectUrl) {
  //   addLog("⚠️ redirectUrl is empty, defaulting to /find-id-fail");
  //   redirectUrl = "/find-id-fail";
  // }

  // addLog("Final redirectUrl confirmed", { redirectUrl });

  // // Store result in session directly (Server Component has direct access)
  // addLog("Saving session data", { redirectUrl });
  // try {
  //   // Get cookies to pass to Route Handler
  //   const cookieStore = cookies();
  //   const cookieHeader = cookieStore
  //     .getAll()
  //     .map((cookie) => `${cookie.name}=${cookie.value}`)
  //     .join("; ");

  //   const saveResponse = await fetch(
  //     `${
  //       process.env.NEXT_PUBLIC_WWW_SERVER_URI || "http://localhost:3000"
  //     }/api/auth/find-id/save-session`,
  //     {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Cookie: cookieHeader, // Pass cookies to Route Handler
  //       },
  //       body: JSON.stringify({ redirectUrl, logData }),
  //     }
  //   );

  //   const saveResult = await saveResponse.json();

  //   if (saveResult.success) {
  //     addLog("✅ Session saved successfully");
  //   } else {
  //     addLog("❌ Failed to save session", { error: saveResult.error });
  //     // Even if session fails, still redirect (client will handle missing data)
  //   }
  // } catch (error: any) {
  //   addLog("❌ Failed to save session directly", { error: error.message });
  //   // Even if session fails, still redirect (client will handle missing data)
  // }

  // Redirect to intermediate page that will close popup
  redirect(
    `/auth/nice/find-id-callback/result?redirectUrl=${encodeURIComponent(
      redirectUrl
    )}`
  );
}
