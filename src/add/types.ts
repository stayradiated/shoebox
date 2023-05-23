import type { Package } from '../types.js'

export type TemplateFn = (options: { name: string }) => Promise<Package>
