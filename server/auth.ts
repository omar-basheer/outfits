import { timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';

// One shared password protects the whole app, since the URL is public once deployed.
// The browser shows its own login prompt and remembers it; the username is ignored.
export function passwordGate(password: string): RequestHandler {
  const expected = Buffer.from(password);

  return (req, res, next) => {
    const encoded = (req.headers.authorization ?? '').replace(/^Basic /, '');
    const [, ...rest] = Buffer.from(encoded, 'base64').toString().split(':');
    const given = Buffer.from(rest.join(':'));

    if (given.length === expected.length && timingSafeEqual(given, expected)) return next();
    res.set('WWW-Authenticate', 'Basic realm="Outfits"').sendStatus(401);
  };
}
