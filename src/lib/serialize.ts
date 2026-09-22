export interface LinkDto {
  id: string;
  slug: string;
  destinationUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function serializeLink(link: {
  id: string;
  slug: string;
  destinationUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): LinkDto {
  return {
    id: link.id,
    slug: link.slug,
    destinationUrl: link.destinationUrl,
    isActive: link.isActive,
    createdAt: link.createdAt.toISOString(),
    updatedAt: link.updatedAt.toISOString(),
  };
}