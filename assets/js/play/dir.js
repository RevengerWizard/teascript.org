// Read-only filesystem backed by files served from public/fs.
export class DirectoryFS {
    constructor(files) { this.files = files }
    _path(path) {
        const out = []
        for (const part of String(path).replace(/\\/g, '/').split('/')) {
            if (!part || part === '.') continue
            if (part === '..') out.pop(); else out.push(part)
        }
        return out.join('/') || '.'
    }
    readFileSync(path) {
        const data = this.files.get(this._path(path))
        if (!data) throw Object.assign(new Error('ENOENT: ' + path), { code: 'ENOENT' })
        return data.slice()
    }
    statSync(path) {
        const key = this._path(path)
        if (this.files.has(key)) return this._stats(this.files.get(key).length, true)
        const prefix = key === '.' ? '' : key + '/'
        if ([...this.files.keys()].some(name => name.startsWith(prefix))) return this._stats(0, false)
        throw Object.assign(new Error('ENOENT: ' + path), { code: 'ENOENT' })
    }
    _stats(size, file) {
        const now = Date.now()
        return { size, dev: 0, ino: 0, nlink: 1, atimeMs: now, mtimeMs: now, ctimeMs: now,
            isFile: () => file, isDirectory: () => !file, isSymbolicLink: () => false }
    }
    readdirSync(path) {
        const prefix = this._path(path) === '.' ? '' : this._path(path) + '/'
        const names = new Set()
        for (const name of this.files.keys()) if (name.startsWith(prefix)) names.add(name.slice(prefix.length).split('/')[0])
        return [...names].map(name => ({ name, isFile: () => this.files.has(prefix + name), isDirectory: () => !this.files.has(prefix + name) }))
    }
    readlinkSync(path) {
        throw Object.assign(new Error('EINVAL: not a symbolic link'), { code: 'EINVAL' })
    }
}

export async function loadDirectoryFS(base = './fs/', manifest = './fs/index.json') {
    const response = await fetch(manifest)
    if (!response.ok) throw new Error('Missing fs/index.json; list the files in that manifest')
    const names = await response.json()
    const files = new Map()
    for (const name of names) {
        const path = String(name).replace(/^\/+/, '')
        const file = await fetch(base + path)
        if (!file.ok) throw new Error('Unable to load fs/' + path)
        files.set(path, new Uint8Array(await file.arrayBuffer()))
    }
    return new DirectoryFS(files)
}
