export const paths = {
  welcome: '/',
  home: '/',
  rpz: '/rpz',
  analytics: '/analytics',
  procurements: '/procurements',
  reports: '/reports',
  administration: '/administration',
  profile: '/profile',
} as const;

export type AppPath = (typeof paths)[keyof typeof paths];
