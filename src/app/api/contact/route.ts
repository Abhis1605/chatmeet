import { sendSupportEmail } from "@/lib/resend";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const topic = typeof body.topic === "string" ? body.topic.trim() : "General";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";

    if (!firstName || !lastName || !email || !message || !emailPattern.test(email)) {
      return Response.json({ error: "Please provide valid contact details and a message." }, { status: 400 });
    }

    if (message.length > 1000 || phone.length > 40) {
      return Response.json({ error: "The submitted information is too long." }, { status: 400 });
    }

    await sendSupportEmail({ firstName, lastName, email, topic, message, phone });
    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to submit contact form:", error);
    return Response.json({ error: "We could not send your message. Please try again." }, { status: 500 });
  }
}
