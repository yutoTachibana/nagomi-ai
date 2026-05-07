'use client';

import { Printer } from 'lucide-react';

export function ReportPrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="btn-primary w-full"
    >
      <Printer size={16} />
      印刷 / PDF として保存
    </button>
  );
}
