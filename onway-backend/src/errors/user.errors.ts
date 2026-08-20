import { NotFoundError, ConflictError } from "./app-error";

//The :id in PATCH /users/:id/role doesn't match any user. 
export class UserNotFoundError extends NotFoundError {
  constructor(userId: string) {
    super(`User ${userId} not found`, "USER_NOT_FOUND");
  }
}


 //Refuses to demote/change the role of the last remaining admin away
 //from 'admin'. Applies uniformly whether the caller is demoting
 //themselves or another admin — the invariant being protected is
  //"at least one admin always exists", not "an admin can't touch their
 // own role".
 
export class LastAdminError extends ConflictError {
  constructor() {
    super(
      "Cannot change this user's role: they are the last remaining administrator",
      "LAST_ADMIN",
    );
  }
}
