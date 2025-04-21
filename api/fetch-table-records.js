import { NextResponse } from "next/server";
import Airtable from "airtable";

const baseId = "appx1vVOIK3mHOuQk"; // Airtable Base ID
const tableName = "Golf and Sports Turf Program Product Prices"; // TABLE for Products/Pallets
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  baseId
);

export async function GET() {
  try {
    const records = await base(tableName).select({ view: "Grid view" }).all();

    const mainProducts = records
      .filter((record) => record.fields.Section === "Product")
      .map((record) => record.fields);

    const palletOffers = records
      .filter((record) => record.fields.Section === "Pallet Offer")
      .map((record) => record.fields);

    return NextResponse.json({ mainProducts, palletOffers });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch table records." },
      { status: 500 }
    );
  }
}
