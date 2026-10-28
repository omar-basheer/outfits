import { removeBackground, type Config } from '@imgly/background-removal-node';

// The model files ship inside the package, so this runs offline.
const config: Config = {
  publicPath: new URL('../node_modules/@imgly/background-removal-node/dist/', import.meta.url).href,
  model: 'medium',
  output: { format: 'image/png' },
};

// Returns a transparent PNG of the clothing item without its background.
export async function cutOut(jpeg: Buffer): Promise<Buffer> {
  const png = await removeBackground(new Blob([new Uint8Array(jpeg)], { type: 'image/jpeg' }), config);
  return Buffer.from(await png.arrayBuffer());
}
