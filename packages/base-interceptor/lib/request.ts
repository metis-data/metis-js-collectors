import * as https from "https";

export type Response = {
  statusCode: number;
  json: any;
  text: string;
  headers: { [key: string]: string | string[] };
};

export function shouldRetry(status: number): boolean {
  return status >= 500 || status === 408;
}

export async function postWithRetries(
  url: string,
  data: string,
  options = {},
  retries = 3,
): Promise<Response | undefined> {
  let response: Response;
  while (retries >= 0) {
    retries--;

    try {
      response = await post(url, data, options);
    } catch (e: any) {
      // If we there are no more retries just throw it.
      if (retries === 0) {
        throw e;
      }
      continue;
    }

    if (shouldRetry(response.statusCode)) {
      continue;
    } else break;
  }

  return response;
}

// Source: https://stackoverflow.com/a/67094088
export async function post(
  url: string,
  data: string,
  options: any,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      const body = [];
      res.on("data", (chunk) => body.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(body).toString();
        const json = JSON.parse(text);
        resolve({
          headers: res.headers,
          statusCode: res.statusCode,
          json,
          text,
        });
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request time out"));
    });

    req.write(data);
    req.end();
  });
}
