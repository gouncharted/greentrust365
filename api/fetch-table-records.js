import { NextResponse } from "next/server";
import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  "appx1vVOIK3mHOuQk"
);

export async function GET() {
  try {
    const records = await base("Golf and Sports Turf Program Product Prices")
      .select({ sort: [{ field: "Product", direction: "asc" }] })
      .all();

    const products = records.map((record) => record.fields);

    return NextResponse.json({ products });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch table products." },
      { status: 500 }
    );
  }
}
