import { NextResponse } from "next/server";
import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  "appx1vVOIK3mHOuQk"
);

export async function GET() {
  try {
    const productRecords = await base(
      "Golf and Sports Turf Program Product Prices"
    )
      .select({ view: "Grid view" })
      .all();

    const mainProducts = productRecords
      .filter((record) => record.fields.Section === "Product")
      .map((record) => record.fields);

    const palletOffers = productRecords
      .filter((record) => record.fields.Section === "Pallet Offer")
      .map((record) => record.fields);

    return NextResponse.json({
      mainProducts,
      palletOffers,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch table records." },
      { status: 500 }
    );
  }
}
