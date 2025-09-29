import React, { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import apiFetch from "../services/api"; 
import routes from "../routes";

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </td>
    <td className="px-6 py-4">
      <div className="flex justify-center">
        <div className="h-8 bg-gray-200 rounded w-24"></div>
      </div>
    </td>
  </tr>
);

const ViewIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const DokumenTable = () => {
  const [data, setData] = useState({ documents: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page, per_page: perPage });
      const result = await apiFetch(`/documents/?${params}`);
      setData({
        documents: result.documents || [],
        pagination: result.pagination || {},
      });
    } catch (e) {
      setError(e.message);
      setData({ documents: [], pagination: {} });
    } finally {
      setLoading(false);
    }
  }, [page, perPage]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);
  
  const { pagination, documents } = data;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">
          Manajemen Dokumen PDF
        </h2>
        <p className="text-gray-600 text-sm md:text-base">
          Kelola, lihat, dan rekonstruksi tabel dari dokumen yang telah diproses.
        </p>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
              <tr>
                <th scope="col" className="px-6 py-3 font-semibold">Nama File</th>
                <th scope="col" className="px-6 py-3 font-semibold text-center">Total Halaman</th>
                <th scope="col" className="px-6 py-3 font-semibold text-center">Halaman Tabel</th>
                <th scope="col" className="px-6 py-3 font-semibold">Tanggal Proses</th>
                <th scope="col" className="px-6 py-3 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
              ) : error ? (
                <tr><td colSpan="5" className="text-center py-10 text-red-500">Gagal memuat data: {error}</td></tr>
              ) : documents.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-10 text-gray-500">Belum ada dokumen yang diproses.</td></tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-800 max-w-sm truncate">{doc.filename}</td>
                    <td className="px-6 py-4 text-center">{doc.total_pages}</td>
                    <td className="px-6 py-4 text-center font-medium text-blue-600">{doc.table_page_count}</td>
                    <td className="px-6 py-4">{new Date(doc.processed_at).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                    <td className="px-6 py-4 text-center">
                      <NavLink
                         to={routes.detailDokumen(doc.id)}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white font-medium px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs"
                      >
                        <ViewIcon />
                        <span>Lihat Detail</span>
                      </NavLink>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- Kontrol Pagination --- */}
        {!loading && documents.length > 0 && (
          <div className="flex flex-col md:flex-row justify-between items-center pt-4 border-t border-gray-200 mt-4 gap-4">
            <span className="text-sm text-gray-600">
              Menampilkan <span className="font-semibold">{((pagination.current_page - 1) * pagination.per_page) + 1}</span> - <span className="font-semibold">{Math.min(pagination.current_page * pagination.per_page, pagination.total_items)}</span> dari <span className="font-semibold">{pagination.total_items}</span> dokumen
            </span>
            <div className="inline-flex items-center space-x-2">
              <button onClick={() => setPage(pagination.current_page - 1)} disabled={!pagination.has_prev || loading} className="px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                Sebelumnya
              </button>
              <span className="text-sm font-semibold text-gray-700">
                Halaman {pagination.current_page} dari {pagination.total_pages}
              </span>
              <button onClick={() => setPage(pagination.current_page + 1)} disabled={!pagination.has_next || loading} className="px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ManajemenDokumen() {
  return <DokumenTable />;
}