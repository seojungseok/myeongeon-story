import fs from "node:fs";

/**
 * ── Local-Windows compatibility shim ────────────────────────────────────────
 * On some non-NTFS Windows volumes (e.g. an exFAT/removable drive like F:),
 * fs.readlink() on a REGULAR FILE returns the non-standard error code EISDIR,
 * whereas webpack/enhanced-resolve only tolerate the normal EINVAL/ENOENT.
 * That makes `next build` / `next dev` crash with:
 *     "EISDIR: illegal operation on a directory, readlink '...'"
 * We translate that bogus EISDIR into EINVAL so resolution proceeds normally.
 * This is a no-op on healthy filesystems (Linux/Vercel, NTFS C:), so it is
 * completely safe to keep.
 */
function patchReadlinkEISDIR() {
  const asEINVAL = (err) => {
    if (err && err.code === "EISDIR") {
      const e = new Error("EINVAL: invalid argument, readlink");
      e.code = "EINVAL";
      e.errno = -22;
      e.syscall = "readlink";
      return e;
    }
    return err;
  };

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
        args[args.length - 1] = (err, ...rest) =>
          cb(err ? asEINVAL(err) : err, ...rest);
      }
      return origAsync.apply(this, args);
    };
    fs.readlink.__eisdirPatched = true;
  }
}

patchReadlinkEISDIR();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // We cache Pexels images locally into /public/images at build time,
  // so no remote image domains are needed and no runtime image API calls happen.
  images: {
    // Local images are served statically; keep unoptimized to avoid
    // Vercel Image Optimization function invocations (free-tier friendly).
    unoptimized: true,
  },
  webpack: (config) => {
    // We don't rely on symlinked packages; skipping symlink resolution avoids
    // extra readlink syscalls (see the shim above).
    config.resolve.symlinks = false;
    return config;
  },
};

export default nextConfig;
