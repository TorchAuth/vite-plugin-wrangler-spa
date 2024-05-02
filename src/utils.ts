import { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import { ResolvedCloudflareSpaConfig } from './CloudflareSpaConfig';
import { UserConfig } from 'vite';
import { builtinModules } from 'node:module';
import { gzipSync } from 'node:zlib';
import { splitCookiesString } from 'set-cookie-parser';
import type { UnstableDevWorker } from 'wrangler';

/*
  Credits to the SvelteKit team and Astro team. 
  Much of this was swiped from Astro, who in turn swiped it from SvelteKit.
	https://github.com/sveltejs/kit/blob/8d1ba04825a540324bc003e85f36559a594aadc2/packages/kit/src/exports/node/index.js
*/

// undici types are required to avoid collision between node `Response` and fetch `Response`
import type { RequestInit, Response } from 'undici';

/**
 * Make a request to the Miniflare server. This returns a mutated version of the `res` object that is passed in.
 * @param req Node Request object
 * @param res Node Response object
 * @param miniflareFetch Fetch function used to access the Miniflare server
 * @returns
 */
export const makeMiniflareFetch = async (
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  miniflareFetch: UnstableDevWorker['fetch']
) => {
  const { rawHeaders, method, url } = req;

  const headers: Record<string, string> = {};
  for (let i = 0; i < rawHeaders.length; i += 2) {
    const { [i]: key, [i + 1]: value } = rawHeaders;
    if (key.charCodeAt(0) !== /*:*/ 0x3a) {
      headers[key] = value;
    }
  }

  const wranglerReq: Omit<RequestInit, 'dispatcher'> = {
    headers,
    method,
    redirect: 'manual',
  };

  if (!['GET', 'HEAD'].includes(method!.toUpperCase())) {
    wranglerReq.body = Readable.toWeb(req);
    wranglerReq.duplex = 'half';
  }

  const wranglerResp = await miniflareFetch(url, wranglerReq);
  convertMiniflareResponse(wranglerResp, res);
  return res;
};

/** Convert the webworker fetch response back into a NodeJS response object */
export const convertMiniflareResponse = async (wranglerResponse: Response, res: ServerResponse<IncomingMessage>) => {
  const headers = Object.fromEntries(wranglerResponse.headers);
  let cookies: string[] = [];

  if (wranglerResponse.headers.has('set-cookie')) {
    const header = wranglerResponse.headers.get('set-cookie')!;
    const split = splitCookiesString(header);
    cookies = split;
  }

  if (!wranglerResponse.body) {
    res.writeHead(wranglerResponse.status, { ...headers, 'set-cookie': cookies });
    res.end();
    return;
  }

  if (wranglerResponse.body.locked) {
    res.writeHead(wranglerResponse.status, { ...headers, 'set-cookie': cookies });
    res.write(
      'Fatal error: Response body is locked. ' +
        `This can happen when the response was already read (for example through 'response.json()' or 'response.text()').`
    );
    res.end();
    return;
  }

  const cancel = (error?: Error) => {
    res.off('close', cancel);
    res.off('error', cancel);

    // If the reader has already been interrupted with an error earlier,
    // then it will appear here, it is useless, but it needs to be catch.
    if (error) res.destroy(error);
  };

  res.on('close', cancel);
  res.on('error', cancel);

  try {
    /**
     * Since miniflare returns gzip content now, we have to re-wrap the content so the browser doesn't get mad
     * The alternative is to just pretend miniflare didn't gzip it and erase the content-encoding header,
     * but this could cause problems later if miniflare continues with gzip
     *
     * For now we presume Miniflare intends to gzip content, in production this shouldn't matter anyway because
     * we don't have to translate request/response between node and worker types
     */
    const buff = gzipSync(await wranglerResponse.arrayBuffer());

    res.writeHead(wranglerResponse.status, { ...headers, 'set-cookie': cookies, 'content-length': buff.length });

    for (let start = 0; start < buff.length; start += res.writableHighWaterMark) {
      const chunk = Uint8Array.prototype.slice.call(buff, start, start + res.writableHighWaterMark);
      res.write(chunk);
      //TODO: drain needed for big response bodies?
    }

    res.end();
    return;
  } catch (error) {
    cancel(error instanceof Error ? error : new Error(String(error)));
  }
};

export const getViteConfig = ({ functionEntrypoint, external }: ResolvedCloudflareSpaConfig) => {
  return {
    ssr: {
      external,
      noExternal: true,
    },
    esbuild: false, // we use SWC to build
    build: {
      sourcemap: true, // always include sourcemaps
      rollupOptions: {
        external: [...builtinModules, /^node:/],
        input: functionEntrypoint,
        preserveEntrySignatures: 'allow-extension',
        output: { entryFileNames: '_worker.js' },
      },
      emptyOutDir: false,
      ssr: true,
    },
  } as UserConfig;
};

/**
 * Check if supplied path matches the regex value.
 *
 * We strip off wildcards to avoid partial matches, and force searching from only the start of the path.
 * @param value The route path to match
 * @returns True if path matches
 */
export const doesPathMatch = (value: string, currentPath: string) =>
  new RegExp(`^${value.replace('*', '')}`).test(currentPath);
