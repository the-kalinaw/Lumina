// Deprecated shim - kept for backwards compatibility
// The project now installs `@supabase/supabase-js` with its own types.
// You can delete this file when you no longer need the fallback.
declare module '@supabase/supabase-js' {
  // Intentionally minimal; prefer the built-in types from the package.
  export function createClient(...args: any[]): any;
}
