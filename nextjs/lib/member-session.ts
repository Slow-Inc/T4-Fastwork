/**
 * Shared shapes for the admin member-content editors (project selection,
 * certificates). Formerly this module also held the member self-service session
 * loaders (getCurrentMember*, hasSession); those were removed when the member area
 * was folded into /admin under flat authz — every linked member is a full admin and
 * edits members from `admin/members/[id]/edit`. Kept as a types-only module (imported
 * by the admin editor components and their page).
 */

export interface EditableProject {
  id: number;
  name: string;
  url: string;
  tech: string[];
  year: number;
  selected: boolean;
}

export interface EditableCertificate {
  id: number;
  issuer: string;
  title: string;
  assetWebp: string | null;
  assetPdf: string | null;
  status: string;
}
