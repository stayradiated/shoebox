import type { Package } from '#src/types.ts'

export type TemplateFn = (options: { name: string }) => Promise<Package>
