const PREFIX = '$ref';

export function isRef(data) {
  return typeof data === 'string' && data.startsWith(PREFIX);
}

export function pathToRef(path) {
  return `${PREFIX}|${path.join('|')}`;
}

export function refToPath(ref) {
  const r = ref.split('|').slice(1);
  const index = r.indexOf('$ref')
  if (index === -1) {
    return r;
  }
  const extra = r.slice(index+1);
  return r.slice(0, index).concat([pathToRef(extra)]);
}
