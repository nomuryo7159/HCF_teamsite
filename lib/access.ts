export class HttpError extends Error { status:number; constructor(status:number,message:string){super(message);this.status=status;} }
export const normalizeEmail=(email:string)=>email.trim().toLowerCase();
export function requireSameOrigin(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)throw new HttpError(403,'このサイトから操作してください');
}

export function approvedSession(access:{signedIn:boolean;isOwner:boolean;canEdit:boolean}){
 const approved=access.signedIn&&access.canEdit;
 return {signedIn:approved,isOwner:approved&&access.isOwner,canEdit:approved};
}
