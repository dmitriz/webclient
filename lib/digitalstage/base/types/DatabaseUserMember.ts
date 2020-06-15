// /users/{uid}/members/{uid}
import {DatabaseStageMember} from "./DatabaseStageMember";

export interface DatabaseUserMember extends DatabaseStageMember {
    volume: number;
}
