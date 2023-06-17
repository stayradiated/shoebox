class InvalidPackageError extends Error {
  filepath: string
  constructor(message: string, filepath: string) {
    super(message)
    this.filepath = filepath
  }

  override toString() {
    return `Invalid Package: "${this.filepath}"\n${super.toString()}`
  }
}

export { InvalidPackageError }
