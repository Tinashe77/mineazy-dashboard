// src/components/products/ProductBulkImport.jsx
import React, { useState } from 'react';
import { Button, Modal, Alert } from '../ui';
import { Upload, Download, FileSpreadsheet } from 'lucide-react';
import api from '../../services/api';

export const ProductBulkImport = ({ isOpen, onClose, onImportSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [importResult, setImportResult] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setError('Please select a valid CSV file');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('Please select a CSV file');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await api.request('/products/bulk/upload', {
        method: 'POST',
        body: formData,
      });

      setImportResult(response);
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (error) {
      setError(error.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `name,description,price,sku,stock,category,subcategory,tags,imageUrls
"Caterpillar 797F Mining Truck","Heavy-duty mining truck for large-scale operations",3500000,CAT797F001,5,"Mining Equipment","Dump Trucks","mining,truck,caterpillar","https://example.com/cat797f.jpg"
"Komatsu PC2000 Excavator","Large hydraulic excavator for mining",2800000,KOM2000001,3,"Mining Equipment","Excavators","mining,excavator,komatsu","https://example.com/pc2000.jpg"
"Safety Helmet with LED","Mining safety helmet with built-in LED light",89.99,SAFEH001,100,"Safety Equipment","Helmets","safety,helmet,led",""`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setSelectedFile(null);
    setError(null);
    setImportResult(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        reset();
      }}
      title="Bulk Import Products"
      size="lg"
    >
      <div className="space-y-6">
        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {importResult && (
          <Alert variant="success">
            Successfully imported {importResult.imported || 0} products!
            {importResult.failed > 0 && ` (${importResult.failed} failed)`}
          </Alert>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded">
          <h4 className="font-medium text-blue-900 mb-2">Import Instructions:</h4>
          <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
            <li>Download the CSV template</li>
            <li>Fill in your product data following the template format</li>
            <li>Save as CSV file (UTF-8 encoding recommended)</li>
            <li>Upload the file and click Import</li>
          </ol>
        </div>

        {/* Download Template */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={downloadTemplate}
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV Template
          </Button>
        </div>

        {/* File Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-2">
              <label htmlFor="csv-upload" className="cursor-pointer">
                <span className="text-primary-600 hover:text-primary-500 font-medium">
                  Click to upload CSV file
                </span>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            </div>
            {selectedFile ? (
              <div className="mt-3">
                <p className="text-sm text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                CSV files only, max 10MB
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              onClose();
              reset();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            loading={loading}
            disabled={!selectedFile}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Products
          </Button>
        </div>
      </div>
    </Modal>
  );
};