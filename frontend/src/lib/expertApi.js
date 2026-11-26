// Small fetch helper for the expert/consultation pages.
// Uses relative URLs so the CRA proxy keeps session cookies same-origin (like Login.js).
export async function api(path, { method = 'GET', body, headers } = {}) {
    const res = await fetch(path, {
        method,
        credentials: 'include',
        headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
        body: body ? JSON.stringify(body) : undefined,
    });
    let data = {};
    try { data = await res.json(); } catch (e) { /* non-JSON error page */ }
    if (!res.ok) {
        const err = new Error(data.error || 'Something went wrong. Please try again.');
        err.status = res.status;
        throw err;
    }
    return data;
}

// "Irrigation & Water" -> "irrigation_water" (key for translations)
export const areaSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

export const money = (n) => '₹' + Number(n || 0).toFixed(2).replace(/\.00$/, '');

export const STATUS_STYLE = {
    requested: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    completed: 'bg-gray-200 text-gray-700',
    declined: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-200 text-gray-600',
};
