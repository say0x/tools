import pkg from "../../package.json";

/** Plattform-Version aus package.json (SemVer + YYYYMMDD, siehe docs/releases/CHANGELOG.md). */
export const PLATTFORM_VERSION: string = pkg.version;
