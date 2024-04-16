import { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import { splitCookiesString } from 'set-cookie-parser';
import type { Response } from 'undici';
import type { UnstableDevWorker } from 'wrangler';

/** Convert the NodeJS request into a webworker fetch request */
export const makeWranglerFetch = (
  req: IncomingMessage,
  wranglerDevServer: UnstableDevWorker
): Promise<Response> => {
  const { rawHeaders, method, url } = req;

  const headers: Record<string, string> = {};
  for (let i = 0; i < rawHeaders.length; i += 2) {
    const { [i]: key, [i + 1]: value } = rawHeaders;
    if (key.charCodeAt(0) !== /*:*/ 0x3a) {
      headers[key] = value;
    }
  }

  if (method !== 'GET' && method !== 'HEAD') {
    return wranglerDevServer.fetch(url, {
      headers,
      method,
      body: Readable.toWeb(req),
      duplex: 'half',
    });
  }

  return wranglerDevServer.fetch(url, {
    headers,
    method,
  });
};

/** Convert the webworker fetch response back into a NodeJS response object */
export const convertWranglerResponse = (
  wranglerResponse: Response,
  res: ServerResponse<IncomingMessage>
) => {
  const headers = Object.fromEntries(wranglerResponse.headers);
  let cookies: string[] = [];

  if (wranglerResponse.headers.has('set-cookie')) {
    const header = wranglerResponse.headers.get('set-cookie')!;
    const split = splitCookiesString(header);
    cookies = split;
  }

  res.writeHead(wranglerResponse.status, { ...headers, 'set-cookie': cookies });

  if (!wranglerResponse.body) {
    res.end();
    return;
  }

  if (wranglerResponse.body.locked) {
    res.write(
      'Fatal error: Response body is locked. ' +
        `This can happen when the response was already read (for example through 'response.json()' or 'response.text()').`
    );
    res.end();
    return;
  }

  const reader = wranglerResponse.body.getReader();

  if (res.destroyed) {
    reader.cancel();
    return;
  }

  const cancel = (error?: Error) => {
    res.off('close', cancel);
    res.off('error', cancel);

    // If the reader has already been interrupted with an error earlier,
    // then it will appear here, it is useless, but it needs to be catch.
    reader.cancel(error).catch(() => {});
    if (error) res.destroy(error);
  };

  res.on('close', cancel);
  res.on('error', cancel);

  next();
  async function next() {
    try {
      for (;;) {
        const { done, value } = await reader.read();

        if (done) break;

        if (!res.write(value)) {
          res.once('drain', next);
          return;
        }
      }
      res.end();
    } catch (error) {
      cancel(error instanceof Error ? error : new Error(String(error)));
    }
  }
};
