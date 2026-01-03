import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getSessionOptions } from "@/lib/session-config";

/**
 * API Route to save user input email to session
 * This email will be compared with NICE verified email later
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const session = await getIronSession(cookies(), getSessionOptions());
    (session as any).findPasswordInputEmail = email;
    await session.save();

    console.log(`[Save Email] Email saved to session: ${email}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error saving email to session:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
