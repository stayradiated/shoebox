const localTag = (packageName: string) => {
  return `local/${packageName}:${Date.now()}`
}

export { localTag }
