import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.APIFY_TOKEN;
  const datasetId = process.env.APIFY_DATASET_ID;

  const res = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`,
    { cache: "no-store" }
  );

  const data = await res.json();
  return NextResponse.json(data);
}
