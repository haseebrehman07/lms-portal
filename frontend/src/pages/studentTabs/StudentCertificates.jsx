import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Download, ExternalLink, Award } from 'lucide-react';
import api from '../../api/axiosConfig';

const StudentCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setIsLoading(true);
        // UPDATED ENDPOINT: Matches the new backend route
        const response = await api.get('/certificates/me');
        setCertificates(response.data || []);
      } catch (err) {
        console.error('Error fetching certificates:', err);
        setError('Could not load your certificates at this time.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
        <p className="font-medium">Loading your credentials...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 text-gray-800">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Certificates</h1>
        <p className="text-gray-500 mt-1">View, download, and share your earned credentials.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Certificates List */}
      <div className="flex flex-col gap-4">
        {certificates.length === 0 && !error ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
            <p className="text-gray-500">You haven't earned any certificates yet. Complete a course to earn one.</p>
          </div>
        ) : (
          certificates.map((cert) => (
            <div 
              key={cert.id} 
              className="flex flex-col sm:flex-row items-start sm:items-center bg-white rounded-xl shadow-sm border border-gray-200 p-4 gap-6 hover:border-blue-300 transition-colors"
            >
              
              {/* Left: Thumbnail Placeholder */}
              <div className="w-full sm:w-48 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                 <Award className="w-16 h-16 text-gray-300" />
              </div>

              {/* Center: Details */}
              <div className="flex-grow w-full">
                {/* UPDATED: Maps to course_title from backend */}
                <h2 className="text-lg font-bold text-gray-900">{cert.course_title || 'Course Completion'}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Issued by <span className="font-semibold text-gray-800">Tech Titans</span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Date Earned: {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>

              {/* Right: Actions */}
              <div className="flex flex-row sm:flex-col gap-3 w-full sm:w-32 flex-shrink-0 mt-4 sm:mt-0">
                
                {/* Download Button */}
                <a 
                  href={cert.certificate_url || '#'}
                  download
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>

                {/* View Button */}
                <a 
                  href={cert.certificate_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  View
                </a>

              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default StudentCertificates;