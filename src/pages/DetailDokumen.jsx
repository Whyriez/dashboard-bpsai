import React, { useCallback, useEffect, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import apiFetch from "../services/api"; // Pastikan path ini benar
import ReconstructionModal from "../components/document/ReconstructionModal";

// --- Komponen Ikon ---
const BackIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const ReconstructIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SkeletonCard = () => (
  <div className="border border-gray-200 rounded-lg p-4 animate-pulse">
    <div className="bg-gray-200 rounded-md w-full h-40 mb-4"></div>
    <div className="flex justify-between items-center mb-4">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="h-5 bg-gray-200 rounded-full w-24"></div>
    </div>
    <div className="h-9 bg-gray-200 rounded-lg w-full"></div>
  </div>
);

export default function DetailDokumen() {
  const { documentId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(6);

  // --- State Management untuk Modal (Sudah Diperbaiki) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [isReconstructing, setIsReconstructing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // ----------------------------------------------------------------

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page, per_page: perPage });
      const result = await apiFetch(`/documents/${documentId}/tables?${params}`);
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [documentId, page, perPage]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // --- Logika Modal yang Sudah Benar ---
  const openModal = async (chunkId) => {
    setIsModalOpen(true);
    setIsModalLoading(true);
    try {
      const result = await apiFetch(`/documents/chunk/${chunkId}`);
      setModalData(result);
    } catch (err) {
      alert(`Gagal memuat data chunk: ${err.message}`);
      setIsModalOpen(false);
    } finally {
      setIsModalLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalData(null);
  };

  const handleAiReconstruct = async (chunkId) => {
    setIsReconstructing(true);
    try {
      const result = await apiFetch(`/documents/chunk/${chunkId}/reconstruct`, { method: "POST" });
      // Perbarui state modal dengan teks baru dari AI
      setModalData(prev => ({ ...prev, reconstructed_content: result.reconstructed_text }));
    } catch (err) {
      alert(`Error saat rekonstruksi: ${err.message}`);
    } finally {
      setIsReconstructing(false);
    }
  };

  const handleSave = async (chunkId, newContent) => {
    setIsSaving(true);
    try {
      await apiFetch(`/documents/chunk/${chunkId}`, {
        method: "PUT",
        body: JSON.stringify({ content: newContent }),
      });
      closeModal();
      // Muat ulang data di halaman utama untuk update status "Sudah Direkonstruksi"
      fetchDetails(); 
    } catch (err) {
      alert(`Error saat menyimpan: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Gunakan environment variable untuk URL API
  const API_URL = "http://127.0.0.1:5001";

  if (loading && !data) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse mb-6">
          <div className="h-5 bg-gray-200 rounded w-48 mb-3"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">Gagal memuat data detail: {error}</div>;
  }

  if (!data) return null;

  const { pagination, table_pages, filename } = data;

  return (
    <div className="p-4 md:p-6">
      {/* --- Header Halaman --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <NavLink to="/manajemen-dokumen" className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm mb-2">
            <BackIcon />
            Kembali ke Daftar Dokumen
          </NavLink>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 truncate" title={filename}>
            Detail Dokumen: {filename}
          </h2>
          <p className="text-gray-600 text-sm md:text-base">
            Daftar halaman yang terdeteksi sebagai tabel. Rekonstruksi tabel untuk meningkatkan akurasi AI.
          </p>
        </div>
        <button className="bg-green-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap">
          Rekonstruksi Semua Halaman
        </button>
      </div>

      {/* --- Grid Kartu Halaman Tabel --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(perPage)].map((_, i) => <SkeletonCard key={i} />)
        ) : table_pages.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-500">
            Tidak ada halaman tabel yang ditemukan di dokumen ini.
          </div>
        ) : (
          table_pages.map((chunk) => (
            <div key={chunk.chunk_id} className="border border-gray-200 bg-white rounded-lg shadow-sm flex flex-col">
              <div className="p-4 border-b border-gray-200">
                {chunk.image_path ? (
                  <img src={`${API_URL}${chunk.image_path}`} alt={`Pratinjau Halaman ${chunk.page_number}`} className="rounded-md w-full h-auto object-contain bg-gray-50 border"/>
                ) : (
                  <div className="flex items-center justify-center h-40 bg-gray-100 text-gray-400 rounded-md">
                    Gambar tidak tersedia
                  </div>
                )}
              </div>
              <div className="p-4 flex-grow flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-gray-800">Halaman {chunk.page_number}</h3>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${chunk.status === "Sudah Direkonstruksi" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {chunk.status}
                  </span>
                </div>
                <div className="mt-auto">
                  <button
                    onClick={() => openModal(chunk.chunk_id)} // <-- Panggil fungsi 'openModal' yang benar
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-medium px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <ReconstructIcon />
                    <span>Rekonstruksi</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- Kontrol Pagination --- */}
      {!loading && pagination && pagination.total_items > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-center pt-4 border-t border-gray-200 mt-6 gap-4">
          <span className="text-sm text-gray-600">
            Menampilkan <span className="font-semibold">{((pagination.current_page - 1) * pagination.per_page) + 1}</span> - <span className="font-semibold">{Math.min(pagination.current_page * pagination.per_page, pagination.total_items)}</span> dari <span className="font-semibold">{pagination.total_items}</span> halaman tabel
          </span>
          <div className="inline-flex items-center space-x-2">
            <button onClick={() => setPage(pagination.current_page - 1)} disabled={!pagination.has_prev} className="px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
              Sebelumnya
            </button>
            <span className="text-sm font-semibold text-gray-700">
              Halaman {pagination.current_page} dari {pagination.total_pages}
            </span>
            <button onClick={() => setPage(pagination.current_page + 1)} disabled={!pagination.has_next} className="px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
              Berikutnya
            </button>
          </div>
        </div>
      )}

      {/* Render Modal hanya jika isModalOpen bernilai true */}
      {isModalOpen && (
        <ReconstructionModal
          isLoading={isModalLoading}
          chunkData={modalData}
          onClose={closeModal}
          onReconstruct={handleAiReconstruct}
          onSave={handleSave}
          isReconstructing={isReconstructing}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}