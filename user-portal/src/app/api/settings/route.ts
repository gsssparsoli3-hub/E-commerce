import { db } from "@/lib/db";
import { cachedJson, serverError } from "@/lib/api-helpers";
import { serializeSettings } from "@/lib/serializers";

export async function GET() {
  try {
    let setting = await db.siteSetting.findUnique({ where: { id: "singleton" } });
    if (!setting) {
      setting = await db.siteSetting.create({ data: { id: "singleton" } });
    }
    return cachedJson({ settings: serializeSettings(setting) }, { sMaxage: 600, swr: 1800 });
  } catch (error) {
    return serverError(error);
  }
}
