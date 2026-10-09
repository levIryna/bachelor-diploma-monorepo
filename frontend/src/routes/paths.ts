export const paths = {
  welcome: '/',
  home: '/',
  rpz: '/rpz',
  analytics: '/analytics',
  procurements: '/procurements',
  reports: '/reports',
  administration: '/administration',
} as const;

export type AppPath = (typeof paths)[keyof typeof paths];
