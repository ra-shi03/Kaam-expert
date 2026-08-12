import { USER_ROLES } from '../constants/userRoles.js'

/** Post-login / wrong-panel redirect target per role */
export function getRoleHomePath(role) {
  switch (role) {
    case USER_ROLES.ADMIN:
      return '/admin'
    case USER_ROLES.LABOUR:
    case USER_ROLES.CUSTOMER:
    default:
      return '/app'
  }
}
