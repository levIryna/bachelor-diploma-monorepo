/** Отримання років, для яких доступні дані. Пізніше — реальний HTTP-запит. */
export async function getAvailableYears(): Promise<string[]> {
  return ['2025', '2024', '2023', '2022', '2021'];
}
