import { ok } from "../../lib/http.js";
import * as dashboardService from "./service.js";

export async function getOverview(req, res) {
  const { preset, from, to } = req.query;
  const overview = await dashboardService.getDashboardOverview({ preset, from, to });
  return ok(res, overview);
}

export async function globalSearch(req, res) {
  const { q } = req.query;
  const results = await dashboardService.searchGlobalAdmin(q);
  return ok(res, results);
}

