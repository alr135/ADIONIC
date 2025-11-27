// pb.js
import PocketBase from "pocketbase";

// Crear una única instancia (singleton)
export const pb = new PocketBase("http://127.0.0.1:8090");

// NOTE: A legacy dev account used to live here for local testing, but we no longer
// keep real credentials in the codebase. The original declaration was removed from
// active exports and replaced with the placeholder below for future reference.
/*
export const LEGACY_DEV_ACCOUNT = {
  email: "<REDACTED>",
  password: "<REDACTED>"
}
*/