import { baseApi } from "../store/baseApi";

export interface SupplierItemApi {
  id: string;
  supplierId: string;
  name: string;
  sku?: string | null;
  category: string;
  unit: string;
  pricePaise: number;
  minOrderQty: number;
  inStock: boolean;
  qualityGrade?: string | null;
  leadTimeHours: number;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupplierProfileApi {
  id: string;
  userId: string;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  category?: string | null;
  gstNumber?: string | null;
  deliveryTerms?: string | null;
  rating?: number;
  totalOrdersCompleted?: number;
  createdAt?: string;
}

export const supplierApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyProfile: builder.query<SupplierProfileApi, void>({
      query: () => "/suppliers/my-profile",
      providesTags: ["Supplier"],
      transformResponse: (response: any) => response?.data ?? response,
    }),

    updateMyProfile: builder.mutation<SupplierProfileApi, Partial<SupplierProfileApi>>({
      query: (body) => ({
        url: "/suppliers/my-profile",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Supplier"],
      transformResponse: (response: any) => response?.data ?? response,
    }),

    getMyCatalog: builder.query<SupplierItemApi[], void>({
      query: () => "/suppliers/my-catalog",
      providesTags: ["SupplierCatalog"],
      transformResponse: (response: any) =>
        Array.isArray(response) ? response : response?.data || [],
    }),

    createSupplierItem: builder.mutation<SupplierItemApi, Partial<SupplierItemApi>>({
      query: (body) => ({
        url: "/suppliers/my-catalog",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SupplierCatalog"],
      transformResponse: (response: any) => response?.data ?? response,
    }),

    updateSupplierItem: builder.mutation<
      SupplierItemApi,
      { id: string; data: Partial<SupplierItemApi> }
    >({
      query: ({ id, data }) => ({
        url: `/suppliers/my-catalog/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["SupplierCatalog"],
      transformResponse: (response: any) => response?.data ?? response,
    }),

    deleteSupplierItem: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/suppliers/my-catalog/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SupplierCatalog"],
    }),
  }),
});

export const {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useGetMyCatalogQuery,
  useCreateSupplierItemMutation,
  useUpdateSupplierItemMutation,
  useDeleteSupplierItemMutation,
} = supplierApi;

