const PREFIX = '$ref';

export function isRef(data) {
  return typeof data === 'string' &&
    data.substring(0, 4) === PREFIX;
}

export function pathToRef(path) {
  return `${PREFIX}|${path.join('|')}`;
}

export function refToPath(ref) {
  return ref.split('|').slice(1);
}
