import { useState, useEffect, useCallback } from 'react';
import { ownerApi } from '../utils/api';

// =============================================================================
// usePlanFeatures — reads the store owner's plan feature gates from the
// backend and provides a simple `hasFeature('ai_chatbot')` API.
//
// Call once in a top-level component (e.g. DashboardLayout) and pass the
// returned object down, or call it directly in any admin component.
// Results are cached for 60 s so it won't hammer the server.
// =============================================================================
let cachedResult = null;
let cacheExp = 0;
const CACHE_TTL = 60_000;

export default function usePlanFeatures() {
  const [plan, setPlan] = useState(cachedResult?.plan || 'free');
  const [features, setFeatures] = useState(cachedResult?.features || []);
  const [limits, setLimits] = useState(cachedResult?.limits || { max_products: 0, max_orders_month: 0, max_staff: 0 });
  const [loading, setLoading] = useState(!cachedResult);

  const load = useCallback(async (force = false) => {
    if (!force && cachedResult && cacheExp > Date.now()) {
      setPlan(cachedResult.plan);
      setFeatures(cachedResult.features);
      setLimits(cachedResult.limits);
      setLoading(false);
      return;
    }
    try {
      const { data } = await ownerApi.getMyFeatures();
      const result = {
        plan: data.plan || 'free',
        features: data.feature_keys || [],
        limits: data.limits || {},
      };
      cachedResult = result;
      cacheExp = Date.now() + CACHE_TTL;
      setPlan(result.plan);
      setFeatures(result.features);
      setLimits(result.limits);
    } catch {
      // Fail-open: if we can't read features, allow everything so we never
      // brick the admin while the server is unreachable.
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const hasFeature = useCallback((key) => features.includes(key), [features]);
  const getLimit = useCallback((type) => limits[`max_${type}`] || 0, [limits]);

  return { plan, features, limits, loading, hasFeature, getLimit, reload: () => load(true) };
}
