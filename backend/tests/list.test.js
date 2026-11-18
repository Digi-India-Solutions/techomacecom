import { test } from "node:test";
import assert from "node:assert/strict";
import { buildOrderBy, searchWhere, listMeta, listQuery, queryBool } from "../src/lib/list.js";
import { z } from "zod";

test("listQuery applies defaults and limits", () => {
  const schema = listQuery({ status: z.enum(["active", "inactive"]).optional(), featured: queryBool.optional() });
  assert.deepEqual(schema.parse({}), { page: 1, limit: 20 });
  const parsed = schema.parse({ page: "3", limit: "50", q: "  oxygen ", status: "active", featured: "true" });
  assert.deepEqual(parsed, { page: 3, limit: 50, q: "oxygen", status: "active", featured: true });
  assert.equal(schema.safeParse({ limit: "500" }).success, false);
  assert.equal(schema.parse({ q: "   " }).q, undefined);
});

test("buildOrderBy whitelists keys and adds an id tie-breaker", () => {
  const sortable = { name: "name", createdAt: "created_at", brand: "brand.name" };
  assert.deepEqual(buildOrderBy("-createdAt", sortable), [{ created_at: "desc" }, { id: "desc" }]);
  assert.deepEqual(buildOrderBy("brand,-name", sortable), [{ brand: { name: "asc" } }, { name: "desc" }, { id: "desc" }]);
  assert.deepEqual(buildOrderBy(undefined, sortable, "name"), [{ name: "asc" }, { id: "desc" }]);
  assert.throws(() => buildOrderBy("password_hash", sortable), /Cannot sort by "password_hash"/);
});

test("searchWhere builds case-insensitive OR across fields", () => {
  assert.deepEqual(searchWhere(undefined, ["name"]), {});
  assert.deepEqual(searchWhere("resmed", ["name", "brand.name"]), {
    OR: [{ name: { contains: "resmed", mode: "insensitive" } }, { brand: { name: { contains: "resmed", mode: "insensitive" } } }],
  });
});

test("listMeta", () => {
  assert.deepEqual(listMeta(2, 20, 45), { page: 2, limit: 20, total: 45, totalPages: 3, hasNextPage: true, hasPrevPage: true });
  assert.deepEqual(listMeta(1, 20, 0), { page: 1, limit: 20, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
});
