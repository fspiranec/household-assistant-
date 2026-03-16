import { NextResponse } from "next/server";
import { parseReceiptWithAI } from "@/lib/ai/receipt";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "file is required" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await parseReceiptWithAI(buffer.toString("base64"));
  return NextResponse.json(result);
}
