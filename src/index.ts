import { CloudflareSpaConfig } from './CloudflareSpaConfig';
import { miniflarePlugin } from './miniflarePlugin';
import { swcPlugin } from './swcPlugin';

export const viteWranglerSpa = (config?: CloudflareSpaConfig) => [miniflarePlugin(config), swcPlugin(config)];
