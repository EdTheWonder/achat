"use client"

import React from 'react';
import PDFProcessor from '@/components/PDFProcessor';

const TestPDF: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-4 text-center">Test PDF Upload</h1>
        <PDFProcessor onUpload={() => {}} />
      </div>
    </div>
  );
};

export default TestPDF;
