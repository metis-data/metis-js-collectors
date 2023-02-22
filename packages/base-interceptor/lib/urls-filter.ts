export function createFilter(filters: RegExp[] | string) {
  let f: RegExp[];
  if (typeof filters === 'string') {
    f = (filters as string).split(',').map((r) => new RegExp(r));
  } else {
    f = filters;
  }

  return (url: string) => {
    return f.some((reg) => {
      return url.match(reg);
    });
  };
}
