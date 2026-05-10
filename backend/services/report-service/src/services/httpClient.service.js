async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();

  let payload;

  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response from ${url}`);
  }

  if (!response.ok) {
    throw new Error(payload.message || payload.error || `Request failed: ${url}`);
  }

  return payload;
}

function buildQueryUrl(baseUrl, query = {}) {
  const url = new URL(baseUrl);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

module.exports = {
  fetchJson,
  buildQueryUrl,
};