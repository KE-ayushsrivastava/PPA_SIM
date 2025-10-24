// src/utils/simulateScenario.js
export async function simulateScenario(scenarioDetail, { signal } = {}) {
  try {
    // Step 1: extract fields from saved scenario
    const {
      filters = {},
      product_selections = [],
      price_point_index = [],
    } = scenarioDetail;

    // Step 2: build URLSearchParams just like handleApply()
    const params = new URLSearchParams();

    // Add filters
    Object.entries(filters).forEach(([key, vals]) => {
      if (Array.isArray(vals) && vals.length > 0) {
        params.set(key, vals.join(","));
      }
    });

    // Add selectedBrands (checkbox states)
    // Convert 1/0 array → brand indices that are selected
    const selectedBrands = Array.isArray(product_selections)
      ? product_selections
      : [];
    // Add selectedPrices (price point indices)
    const selectedPrices = Array.isArray(price_point_index)
      ? price_point_index
      : [];

    params.set("selectedBrands", selectedBrands.join(","));
    params.set("selectedPrices", selectedPrices.join(","));

    // Step 3: build final URL
    const queryString = params.toString();
    console.log("queryString");
    console.log(queryString);
    const url = queryString ? `/chart_data?${queryString}` : `/chart_data`;

    // Step 4: call the same backend endpoint as handleApply
    const res = await fetch(url, { signal });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Simulate API error: ${res.status} ${text}`);
    }

    // Step 5: parse response
    const data = await res.json();

    // Return normalized object for our ResultComparison
    return {
      market_share: data.market_share || [],
      elasticity: Object.values(data.price_elasticity || {}),
      filterDef: data.filterDef || "",
    };
  } catch (err) {
    throw err;
  }
}
