export class Util {
    /**
     * 
     * @param {*} path: string should be the path for the module to be required
     * @returns the module in esm
     */
    static async import(path) {
        const { createRequire } = await import('module');
        const { getFilename } = await import('cross-dirname');
        const _require = createRequire(getFilename());
        return _require(path);
    }
}