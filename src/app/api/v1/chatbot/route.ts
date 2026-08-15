import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { processChatbotMessage } from "@/lib/chatbot";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorizedResponse();

    const { message, history = [] } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const result = await processChatbotMessage(user.id, message, history);
    
    // If the result contains an error string (from our fallback or catch), we handle it.
    // But since processChatbotMessage returns { reply, actions }, we can just return it.
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Chatbot Route] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
