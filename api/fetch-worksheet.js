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
    // 1. Fetch the page (title + program year) from Worksheets
    const pageRecord = await base("Worksheets").find(recordId);

    // 2. Fetch all products from the Golf and Sports Turf Program Product Prices table
    const productRecords = await base(
      "Golf and Sports Turf Program Product Prices"
    )
      .select({ view: "Grid view" })
      .all();

    // 3. Separate into Main Products vs Pallet Offers
    const mainProducts = productRecords
      .filter((record) => record.fields.Section === "Product")
      .map((record) => record.fields);

    const palletOffers = productRecords
      .filter((record) => record.fields.Section === "Pallet Offer")
      .map((record) => record.fields);

    // 4. Return everything cleanly
    return NextResponse.json({
      pageFields: pageRecord.fields,
      mainProducts,
      palletOffers,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch worksheet." },
      { status: 500 }
    );
  }
}
