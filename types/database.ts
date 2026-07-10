export type TipoPedido = "porte_propio" | "trailer_fabrica";
export type EstadoPedido = "pendiente" | "confirmado" | "entregado" | "cancelado";

export interface MaterialItem {
  material: string;
  cantidad: number | null;
  unidad: string;
}

export interface Camion {
  id: string;
  nombre: string;
  capacidad_toneladas: number;
  chofer_habitual: string | null;
  tipo: string;
}

export interface Cliente {
  id: string;
  codigo_softek: string | null;
  nombre: string;
  nombre_comercial: string | null;
  telefono: string | null;
  nif: string | null;
  origen: string;
  created_at: string;
}

export interface Producto {
  id: string;
  codigo_softek: string | null;
  descripcion: string;
  precio: number | null;
  ref_proveedor: string | null;
  ean: string | null;
  activo: boolean;
  origen: string;
  created_at: string;
}

export interface Pedido {
  id: string;
  cliente: string;
  direccion: string | null;
  materiales: MaterialItem[];
  tipo: TipoPedido;
  camion_id: string | null;
  fabrica_origen: string | null;
  obra: string | null;
  fecha_entrega: string;
  franja_horaria: string | null;
  estado: EstadoPedido;
  notas: string | null;
  creado_por: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  requiere_revision: boolean;
  camiones?: Camion | null;
}
