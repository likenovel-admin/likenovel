import { getSessionOptions } from "@/lib/session-config";
import axios from "axios";
import crypto from "crypto";
import iconv from "iconv-lite";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * NICE 본인인증 콜백 - Find Password
 * Server component processes data and redirects to result page
 */
export default async function NiceFindPasswordCallback({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  console.log("NICE 본인인증 콜백 - Find Password");

  // Get encryption keys and input email from session
  const session = await getIronSession(cookies(), getSessionOptions());
  const { key, iv } = (session as any) || {};
  const inputEmail = (session as any).findPasswordInputEmail || "";

  const encData = searchParams["enc_data"] as string;
  const tokenVersionId = searchParams["token_version_id"] as string;
  const integrityValue = searchParams["integrity_value"] as string;

  let redirectUrl = "/find-password?error=missing_data";

  if (!inputEmail) {
    console.log("❌ ERROR: Missing input email from session");
    redirectUrl = "/find-password?error=missing_email";
  } else if (!encData || !key || !iv) {
    console.log("❌ ERROR: Missing encryption data or key or iv");
    redirectUrl = "/find-password?error=missing_data";
  } else {
    try {
      console.log("Starting NICE data decryption");
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

      console.log("✅ Decryption successful");

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
      const gender = niceData.gender || "";

      console.log("✅ Parsed NICE data:", { name, birthdate, gender });

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

        console.log("Calling backend API to verify user");

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

        console.log("✅ Backend API response received");

        // API returns: { data: { email, masked_email, signUpType } }
        const verifiedEmail = response.data?.data?.email;

        if (!verifiedEmail) {
          console.log("❌ No email found in response, user not found");
          redirectUrl = "/find-password?error=user_not_found";
        } else if (verifiedEmail.toLowerCase() !== inputEmail.toLowerCase()) {
          // Email mismatch - user exists but email doesn't match
          console.log("❌ Email mismatch:", {
            inputEmail,
            verifiedEmail,
          });
          redirectUrl = "/find-password?error=email_mismatch";
        } else {
          // Email matches - proceed to password reset
          console.log("✅ User found and email verified");
          redirectUrl = `/reset-password?email=${encodeURIComponent(
            verifiedEmail
          )}`;
        }
      } catch (error: any) {
        console.log("❌ Backend API error:", error.message);
        redirectUrl = "/find-password?error=api_error";
      }
    } catch (error: any) {
      console.log("❌ Decryption error:", error.message);
      redirectUrl = "/find-password?error=decryption_error";
    }
  }

  // Save redirectUrl to session so result page can read it
  // (session as any).findPasswordRedirectUrl = redirectUrl;
  // await session.save();

  console.log("Redirecting to result page with redirectUrl:", redirectUrl);

  // Redirect to result page that will close popup and redirect parent
  redirect(
    `/auth/nice/find-password-callback/result?redirectUrl=${encodeURIComponent(
      redirectUrl
    )}`
  );
}
