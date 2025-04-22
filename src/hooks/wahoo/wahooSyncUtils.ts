
import { syncWahooProfileAndRoutes } from "@/components/Wahoo/WahooSyncApi";

export async function syncWahooWithProfile(tokenObj: any) {
  return await syncWahooProfileAndRoutes(tokenObj);
}
