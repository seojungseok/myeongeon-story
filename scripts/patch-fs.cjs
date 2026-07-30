/**
 * fs.readlink EISDIR → EINVAL shim (Node --require preload).
 *
 * Why: on some non-NTFS Windows volumes (e.g. an exFAT/removable drive like F:)
 * fs.readlink() on a REGULAR FILE returns the non-standard code EISDIR, but
 * webpack/enhanced-resolve/graceful-fs only tolerate EINVAL/ENOENT. That makes
 * `next dev` / `next build` crash with:
 *     "EISDIR: illegal operation on a directory, readlink '...'"
 *
 * Loaded via NODE_OPTIONS=--require=./scripts/patch-fs.cjs so it runs BEFORE any
 * other module (webpack, graceful-fs) in the main process AND every worker
 * process (NODE_OPTIONS is inherited by children). Harmless on healthy
 * filesystems (Linux/Vercel, NTFS), where readlink already returns EINVAL.
 */
const fs = require("node:fs");

function asEINVAL(err) {
  if (err && err.code === "EISDIR") {
    const e = new Error("EINVAL: invalid argument, readlink");
    e.code = "EINVAL";
    e.errno = -22;
    e.syscall = "readlink";
    return e;
  }
  return err;
}

const origSync = fs.readlinkSync;
if (origSync && !origSync.__eisdirPatched) {
  fs.readlinkSync = function (...args) {
    try {
      return origSync.apply(this, args);
    } catch (err) {
      throw asEINVAL(err);
    }
  };
  fs.readlinkSync.__eisdirPatched = true;
}

const origAsync = fs.readlink;
if (origAsync && !origAsync.__eisdirPatched) {
  fs.readlink = function (...args) {
    const cb = args[args.length - 1];
    if (typeof cb === "function") {
      args[args.length - 1] = (err, ...rest) => cb(err ? asEINVAL(err) : err, ...rest);
    }
    return origAsync.apply(this, args);
  };
  fs.readlink.__eisdirPatched = true;
}

// fs.promises.readlink too (used by some tooling).
try {
  const p = fs.promises;
  const origP = p.readlink;
  if (origP && !origP.__eisdirPatched) {
    p.readlink = function (...args) {
      return origP.apply(this, args).catch((err) => {
        throw asEINVAL(err);
      });
    };
    p.readlink.__eisdirPatched = true;
  }
} catch {
  /* ignore */
}
