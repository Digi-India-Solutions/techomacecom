import { ok } from "../../lib/http.js";
import { logActivity } from "../../services/activity.service.js";
import * as service from "./service.js";

export async function listHeroBanners(req, res) {
  const banners = await service.listHeroBanners();
  return ok(res, banners);
}

export async function getHeroBanner(req, res) {
  const banner = await service.getHeroBannerById(req.params.id);
  if (!banner) {
    return res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Hero banner not found" },
    });
  }
  return ok(res, banner);
}

export async function createHeroBanner(req, res) {
  const banners = await service.createHeroBanner(req.body, req.admin);

  try {
    await logActivity(req, {
      module: "marketing",
      action: "create",
      entityType: "banner",
      entityLabel: req.body.title || "Hero Banner",
      summary: `Created hero banner "${req.body.title || 'Untitled'}"`,
    });
  } catch (err) {
    console.warn("Could not log hero banner creation:", err);
  }

  return ok(res, banners, { status: 201 });
}

export async function updateHeroBanner(req, res) {
  const banners = await service.updateHeroBanner(req.params.id, req.body, req.admin);

  try {
    await logActivity(req, {
      module: "marketing",
      action: "update",
      entityType: "banner",
      entityId: BigInt(req.params.id),
      entityLabel: req.body.title || "Hero Banner",
      summary: `Updated hero banner #${req.params.id} (${req.body.title || ''})`,
    });
  } catch (err) {
    console.warn("Could not log hero banner update:", err);
  }

  return ok(res, banners);
}

export async function reorderHeroBanners(req, res) {
  const orderedList = req.body.ordered || req.body;
  const banners = await service.reorderHeroBanners(orderedList, req.admin);

  try {
    await logActivity(req, {
      module: "marketing",
      action: "update",
      entityType: "banner",
      summary: `Reordered hero banners carousel sequence`,
    });
  } catch (err) {
    console.warn("Could not log hero banner reorder:", err);
  }

  return ok(res, banners);
}

export async function deleteHeroBanner(req, res) {
  const banners = await service.deleteHeroBanner(req.params.id, req.admin);

  try {
    await logActivity(req, {
      module: "marketing",
      action: "delete",
      entityType: "banner",
      entityId: BigInt(req.params.id),
      summary: `Deleted hero banner #${req.params.id}`,
    });
  } catch (err) {
    console.warn("Could not log hero banner delete:", err);
  }

  return ok(res, banners);
}

export async function listPublicHeroBanners(req, res) {
  const banners = await service.listPublicHeroBanners();
  return ok(res, banners);
}


// =============================================================================
// Page Banners Controller
// =============================================================================

export async function listPageBanners(req, res) {
  const banners = await service.listPageBanners(req.query);
  return ok(res, banners);
}

export async function getPageBanner(req, res) {
  const banner = await service.getPageBannerById(req.params.id);
  if (!banner) {
    return res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Page banner not found" },
    });
  }
  return ok(res, banner);
}

export async function createPageBanner(req, res) {
  const banners = await service.createPageBanner(req.body, req.admin);

  try {
    await logActivity(req, {
      module: "marketing",
      action: "create",
      entityType: "page_banner",
      entityLabel: req.body.title || "Page Banner",
      summary: `Created ${req.body.pageType || 'Page'} banner "${req.body.title || 'Untitled'}"`,
    });
  } catch (err) {
    console.warn("Could not log page banner creation:", err);
  }

  return ok(res, banners, { status: 201 });
}

export async function updatePageBanner(req, res) {
  const banners = await service.updatePageBanner(req.params.id, req.body, req.admin);

  try {
    await logActivity(req, {
      module: "marketing",
      action: "update",
      entityType: "page_banner",
      entityId: BigInt(req.params.id),
      entityLabel: req.body.title || "Page Banner",
      summary: `Updated ${req.body.pageType || 'Page'} banner #${req.params.id} (${req.body.title || ''})`,
    });
  } catch (err) {
    console.warn("Could not log page banner update:", err);
  }

  return ok(res, banners);
}

export async function deletePageBanner(req, res) {
  const banners = await service.deletePageBanner(req.params.id, req.admin);

  try {
    await logActivity(req, {
      module: "marketing",
      action: "delete",
      entityType: "page_banner",
      entityId: BigInt(req.params.id),
      summary: `Deleted page banner #${req.params.id}`,
    });
  } catch (err) {
    console.warn("Could not log page banner delete:", err);
  }

  return ok(res, banners);
}

export async function listPublicPageBanners(req, res) {
  const { pageType, targetId, slug } = req.query;
  const banners = await service.listPublicPageBanners({ pageType, targetId, slug });
  return ok(res, banners);
}

// =============================================================================
// Homepage Sections & Announcement Config Controller
// =============================================================================

export async function getHomepageConfig(req, res) {
  const cfg = await service.getHomepageConfig();
  return ok(res, cfg);
}

export async function saveHomepageConfig(req, res) {
  const cfg = await service.saveHomepageConfig(req.body, req.admin);

  try {
    await logActivity(req, {
      module: "marketing",
      action: "update",
      entityType: "homepage_sections",
      summary: "Updated homepage layout sections sequence and top announcement strip",
    });
  } catch (err) {
    console.warn("Could not log homepage layout save:", err);
  }

  return ok(res, cfg);
}
