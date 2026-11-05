const MIN_LETTERS = 2;

export function directoryNameError(name: string, allowDigits: boolean): string {
  const value = name.trim();
  if (value.length === 0) {
    return '';
  }

  const pattern = allowDigits ? /^[\p{L}\d -]+$/u : /^[\p{L} -]+$/u;
  if (!pattern.test(value)) {
    return allowDigits
      ? 'Дозволені лише літери, цифри, пробіл і дефіс'
      : 'Дозволені лише літери, пробіл і дефіс. Цифри не дозволені';
  }

  const letters = value.match(/\p{L}/gu);
  if (!letters || letters.length < MIN_LETTERS) {
    return 'Назва має містити щонайменше 2 літери';
  }

  return '';
}
