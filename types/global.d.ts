declare global {
  var __cumbiadle_search_rate__: Map<string, { count: number; expires: number }> | undefined;
  var __cumbiadle_search_cache__: Map<string, { data: any; expires: number }> | undefined;
}

export {};
