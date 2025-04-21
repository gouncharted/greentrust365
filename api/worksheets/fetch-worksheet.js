import { NextResponse } from "next/server";
import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  "appx1vVOIK3mHOuQk"
);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const recordId = searchParams.get("record");

  if (!recordId) {
    return NextResponse.json(
      { error: "No record ID provided." },
      { status: 400 }
    );
  }

  try {
    const record = await base("Worksheet Pages").find(recordId);

    return NextResponse.json({
      pageFields: record.fields, // just return the top-level fields
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch worksheet page." },
      { status: 500 }
    );
  }
}