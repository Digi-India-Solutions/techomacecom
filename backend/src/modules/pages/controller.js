import { ok } from "../../lib/http.js";
import { logActivity } from "../../services/activity.service.js";
import * as service from "./service.js";

export async function listAdminPages(req, res, next) {
  try {
    const pages = await service.listAdminPages();
    return ok(res, pages);
  } catch (err) {
    next(err);
  }
}

export async function getAdminPage(req, res, next) {
  try {
    const page = await service.getPageByIdOrSlug(req.params.idOrSlug);
    if (!page) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Page not found" },
      });
    }
    return ok(res, page);
  } catch (err) {
    next(err);
  }
}

export async function createAdminPage(req, res, next) {
  try {
    const page = await service.createPage(req.body);

    try {
      await logActivity(req, {
        module: "content",
        action: "create",
        entityType: "page",
        entityId: BigInt(page.id),
        entityLabel: page.title || page.slug,
        summary: `Created CMS page "${page.title}" (/${page.slug})`,
      });
    } catch (logErr) {
      console.warn("Could not log page creation:", logErr.message);
    }

    return ok(res, page, { status: 201 });
  } catch (err) {
    next(err);
  }
}

export async function updateAdminPage(req, res, next) {
  try {
    const page = await service.updatePage(req.params.idOrSlug, req.body);

    try {
      await logActivity(req, {
        module: "content",
        action: "edit",
        entityType: "page",
        entityId: BigInt(page.id),
        entityLabel: page.title || page.slug,
        summary: `Updated CMS page "${page.title}" (/${page.slug})`,
      });
    } catch (logErr) {
      console.warn("Could not log page update:", logErr.message);
    }

    return ok(res, page);
  } catch (err) {
    next(err);
  }
}

export async function deleteAdminPage(req, res, next) {
  try {
    const result = await service.deletePage(req.params.idOrSlug);

    try {
      await logActivity(req, {
        module: "content",
        action: "delete",
        entityType: "page",
        entityLabel: result.slug,
        summary: `Deleted CMS page /${result.slug}`,
      });
    } catch (logErr) {
      console.warn("Could not log page deletion:", logErr.message);
    }

    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

export async function listPublicPages(req, res, next) {
  try {
    const pages = await service.listPublicPages();
    return ok(res, pages);
  } catch (err) {
    next(err);
  }
}

export async function getPublicPage(req, res, next) {
  try {
    const page = await service.getPublicPage(req.params.slug);
    return ok(res, page);
  } catch (err) {
    next(err);
  }
}

