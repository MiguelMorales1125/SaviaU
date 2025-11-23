import { getApiUrl } from '../config/api';

export interface TematicaAreaSummary {
  id: string;
  name: string;
  summary: string;
  accentColor: string;
  heroImage: string;
  resourceCount: number;
  keywords: string[];
}

export interface TematicaResource {
  id: string;
  title: string;
  shortDescription: string;
  detailDescription: string;
  imageUrl: string;
  format: string;
  estimatedTime: string;
  funFact: string;
  deepDive: string;
  sources: string[];
}

export interface TematicaArea extends TematicaAreaSummary {
  tagline: string;
  learningFocus: string[];
  resources: TematicaResource[];
}

const parseJson = async <T>(resp: Response): Promise<T> => {
  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(errorText || 'No se pudo obtener la información');
  }
  return resp.json() as Promise<T>;
};

export const tematicasApi = {
  async getAreas(): Promise<TematicaAreaSummary[]> {
    const resp = await fetch(getApiUrl('/api/tematicas/areas'));
    return parseJson<TematicaAreaSummary[]>(resp);
  },
  async getArea(areaId: string): Promise<TematicaArea> {
    const resp = await fetch(getApiUrl(`/api/tematicas/areas/${areaId}`));
    return parseJson<TematicaArea>(resp);
  }
};
