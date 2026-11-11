let counter = 0;

/** A distinct fake client IP per call, so rate limits don't bleed between tests. */
export function freshIp() {
  counter += 1;
  return `198.51.100.${counter % 250}.${counter}`;
}

export function jsonRequest(url: string, body: unknown, ip: string, init: RequestInit = {}) {
  return new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": ip, ...(init.headers ?? {}) },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

export function getRequest(url: string, ip = "203.0.113.1", headers: Record<string, string> = {}) {
  return new Request(`http://localhost${url}`, { headers: { "x-real-ip": ip, ...headers } });
}

export function params<T extends Record<string, string>>(value: T) {
  return { params: Promise.resolve(value) };
}
