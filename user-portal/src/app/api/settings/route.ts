import { db } from "@/lib/db";
import { json, serverError } from "@/lib/api-helpers";
import { serializeSettings } from "@/lib/serializers";

export async function GET() {
  try {
    let setting = await db.siteSetting.findUnique({ where: { id: "singleton" } });
    if (!setting) {
      setting = await db.siteSetting.create({ data: { id: "singleton" } });
    }
    return json({ settings: serializeSettings(setting) });
  } catch (error) {
    return serverError(error);
  }
}
