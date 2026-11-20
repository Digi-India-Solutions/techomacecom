import { ok } from "../../lib/http.js";
import { logActivity } from "../../services/activity.service.js";
import * as service from "./service.js";

export async function listAdminBlogPosts(req, res, next) {
  try {
    const posts = await service.listAdminBlogPosts();
    return ok(res, posts);
  } catch (err) {
    next(err);
  }
}

export async function getAdminBlogPost(req, res, next) {
  try {
    const post = await service.getAdminBlogPost(req.params.idOrSlug);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Blog post not found" },
      });
    }
    return ok(res, post);
  } catch (err) {
    next(err);
  }
}

export async function createBlogPost(req, res, next) {
  try {
    const post = await service.createBlogPost(req.body, req.admin);

    try {
      await logActivity(req, {
        module: "content",
        action: "create",
        entityType: "blog_post",
        entityId: BigInt(post.id),
        entityLabel: post.title.slice(0, 50),
        summary: `Created blog post "${post.title.slice(0, 40)}" (/${post.slug})`,
      });
    } catch (logErr) {
      console.warn("Could not log blog post creation:", logErr.message);
    }

    return ok(res, post, { status: 201 });
  } catch (err) {
    next(err);
  }
}

export async function updateBlogPost(req, res, next) {
  try {
    const post = await service.updateBlogPost(req.params.idOrSlug, req.body, req.admin);

    try {
      await logActivity(req, {
        module: "content",
        action: "edit",
        entityType: "blog_post",
        entityId: BigInt(post.id),
        entityLabel: post.title.slice(0, 50),
        summary: `Updated blog post "${post.title.slice(0, 40)}" (/${post.slug})`,
      });
    } catch (logErr) {
      console.warn("Could not log blog post update:", logErr.message);
    }

    return ok(res, post);
  } catch (err) {
    next(err);
  }
}

export async function deleteBlogPost(req, res, next) {
  try {
    const result = await service.deleteBlogPost(req.params.idOrSlug);

    try {
      await logActivity(req, {
        module: "content",
        action: "delete",
        entityType: "blog_post",
        entityLabel: result.slug,
        summary: `Deleted blog post /${result.slug}`,
      });
    } catch (logErr) {
      console.warn("Could not log blog post deletion:", logErr.message);
    }

    return ok(res, result);
  } catch (err) {
    next(err);
  }
}

export async function listPublicBlogPosts(req, res, next) {
  try {
    const posts = await service.listPublicBlogPosts();
    return ok(res, posts);
  } catch (err) {
    next(err);
  }
}

export async function getPublicBlogPost(req, res, next) {
  try {
    const post = await service.getPublicBlogPost(req.params.slug);
    return ok(res, post);
  } catch (err) {
    next(err);
  }
}

