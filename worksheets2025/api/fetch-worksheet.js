import { NextResponse } from "next/server";
import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base('appx1vVOIK3mHOuQk');

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const recordId = searchParams.get('record');

  if (!recordId) {
    return NextResponse.json({ error: "No record ID provided." }, { status: 400 });
  }

  try {
    const record = await base('Worksheet Pages').find(recordId);

    // Expand linked Main Products and Pallet Offers
    const mainProductIds = record.get('Main Products') || [];
    const palletOfferIds = record.get('Pallet Offers') || [];
    const footnotes = record.get('Footnotes') || [];

    const mainProducts = mainProductIds.length
      ? await Promise.all(mainProductIds.map(id => base('Worksheet Table Data').find(id)))
      : [];

    const palletOffers = palletOfferIds.length
      ? await Promise.all(palletOfferIds.map(id => base('Worksheet Table Data').find(id)))
      : [];

    return NextResponse.json({
      pageFields: record.fields,
      mainProducts: mainProducts.map(product => product.fields),
      palletOffers: palletOffers.map(product => product.fields),
      footnotes: footnotes,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch worksheet." }, { status: 500 });
  }
}