export interface Package {
  baseExportDir?: string,
  build?: string,
  command?: string,
  dependencies?: string[],
  devDependencies?: string[],
  env?: [string, string][],
  exportEnv?: [string, string][],
  exports?: string[],
  from?: string,
  fromImage?: string,
  install?: string,
  mount?: [string, string][],
  name: string,
  user?: string,
  version: string,
  workdir?: string,
}
