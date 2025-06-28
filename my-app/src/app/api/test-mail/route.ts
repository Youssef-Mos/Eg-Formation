import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET() {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER!,
        pass: process.env.MAIL_PASS!,
      },
    });

    await transporter.sendMail({
      from: `"Eg-Formation" <${process.env.MAIL_USER}>`,
      to: "adresse_destinataire@example.com",
      subject: "Test Email Nodemailer",
      text: "✅ Ceci est un test d'envoi d'email via Gmail + Nodemailer.",
    });

    return NextResponse.json({ success: true, message: "Email envoyé ✅" });
  } catch (error) {
    console.error("❌ Erreur envoi mail :", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
