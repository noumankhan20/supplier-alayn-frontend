import { baseApi, type ApiEnvelope } from "../store/baseApi";

export interface PurchaseOrderItemApi {
  id?: string;
  purchaseOrderId?: string;
  itemId: string;
  orderedQuantity: number;
  dispatchedQuantity?: number;
  receivedQuantity?: number;
  damagedQuantity?: number;
  unitCostPaise: number;
  item?: {
    id: string;
    name: string;
    unit?: string;
    sku?: string | null;
    category?: string;
  };
}

export interface PurchaseOrderApi {
  id: string;
  poNumber?: string;
  supplierId: string;
  status:
    | "DRAFT"
    | "SENT"
    | "PACKING"
    | "PARTIALLY_DISPATCHED"
    | "DISPATCHED"
    | "OUT_OF_STOCK"
    | "PARTIALLY_RECEIVED"
    | "RECEIVED"
    | "CLOSED"
    | "CANCELLED";
  totalAmountPaise: number;
  supplierNotes?: string;
  dispatchDate?: string;
  expectedNextDeliveryDate?: string;
  closedReason?: string;
  closedAt?: string;
  outletId?: string;
  outlet?: {
    id: string;
    name: string;
    restaurantName?: string;
    address?: string;
    city?: string;
    phone?: string;
  };
  supplier?: { id: string; name: string };
  createdAt?: string;
  items: PurchaseOrderItemApi[];
}

export const procurementApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSupplierPortalOrders: builder.query<PurchaseOrderApi[], void>({
      query: () => "/purchase-orders/portal/orders",
      providesTags: ["PurchaseOrder"],
      transformResponse: (response: ApiEnvelope<PurchaseOrderApi[] | null>) => response.data ?? [],
    }),

    updateSupplierPOStatus: builder.mutation<
      PurchaseOrderApi,
      {
        id: string;
        status: "PACKING" | "OUT_OF_STOCK" | "PARTIALLY_DISPATCHED" | "DISPATCHED";
        supplierNotes?: string;
        expectedNextDeliveryDate?: string;
        items?: { itemId: string; dispatchedQuantity: number }[];
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/purchase-orders/portal/orders/${id}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["PurchaseOrder"],
    }),
  }),
});

export const {
  useGetSupplierPortalOrdersQuery,
  useUpdateSupplierPOStatusMutation,
} = procurementApi;

