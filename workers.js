export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Proxy zur Fraunhofer ISE API
    const apiUrl = 'https://api.energy-charts.info' + url.pathname + url.search;

    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    return new Response(response.body, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  },
};
