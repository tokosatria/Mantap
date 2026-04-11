'use client';

import { useEffect, useRef } from 'react';
import { formatDate, formatCurrency } from '@/lib/utils';

interface PrintServiceReceiptProps {
  serviceOrder: any;
  onClose: () => void;
}

const STORE_INFO = {
  name: 'Satria Elektronik',
  address: 'Jl Batalyon 323 Buaya Putih',
  address2: 'Gerbang Pertama Batalyon',
  address3: 'Kel/Kec Purwaharja Rt 23 Rw 11',
  whatsapp: '083895603395',
};

export default function PrintServiceReceipt({ serviceOrder, onClose }: PrintServiceReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '', 'width=300,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Struk Service - ${serviceOrder.orderNumber}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                padding: 10px;
                background: white;
                color: black;
                width: 280px;
              }
              .header {
                text-align: center;
                border-bottom: 1px dashed #000;
                padding-bottom: 10px;
                margin-bottom: 10px;
              }
              .store-name {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 5px;
              }
              .store-address {
                font-size: 10px;
                line-height: 1.4;
                margin-bottom: 3px;
              }
              .whatsapp {
                font-size: 10px;
              }
              .section {
                border-bottom: 1px dashed #000;
                padding-bottom: 8px;
                margin-bottom: 8px;
              }
              .section-title {
                font-weight: bold;
                font-size: 11px;
                margin-bottom: 5px;
              }
              .row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 3px;
                font-size: 11px;
              }
              .items {
                margin-bottom: 8px;
              }
              .item {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 4px;
                font-size: 11px;
              }
              .item-info {
                flex: 1;
                padding-right: 5px;
              }
              .item-name {
                font-weight: bold;
              }
              .item-detail {
                font-size: 10px;
                color: #666;
              }
              .item-price {
                text-align: right;
                font-size: 11px;
              }
              .total-section {
                border-top: 1px dashed #000;
                border-bottom: 1px dashed #000;
                padding: 8px 0;
                margin-bottom: 8px;
              }
              .total-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 3px;
                font-size: 12px;
              }
              .total-row.final {
                font-weight: bold;
                font-size: 13px;
                margin-top: 5px;
              }
              .footer {
                text-align: center;
                margin-top: 10px;
              }
              .thank-you {
                font-size: 12px;
                font-weight: bold;
                margin-bottom: 5px;
              }
              .validity {
                font-size: 10px;
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  useEffect(() => {
    handlePrint();
    onClose();
  }, []);

  const totalBill = (serviceOrder.finalPrice || 0) + (serviceOrder.sparepartsTotal || 0);
  const remainingPayment = totalBill - (serviceOrder.dpAmount || 0);

  return (
    <div className="hidden">
      <div ref={printRef}>
        {/* Header */}
        <div className="header">
          <div className="store-name">{STORE_INFO.name}</div>
          <div className="store-address">{STORE_INFO.address}</div>
          <div className="store-address">{STORE_INFO.address2}</div>
          <div className="store-address">{STORE_INFO.address3}</div>
          <div className="whatsapp">Whatsapp: {STORE_INFO.whatsapp}</div>
        </div>

        {/* Order Info */}
        <div className="section">
          <div className="section-title">INFORMASI SERVICE</div>
          <div className="row">
            <span>No. Order:</span>
            <span>{serviceOrder.orderNumber}</span>
          </div>
          <div className="row">
            <span>Tanggal:</span>
            <span>{formatDate(serviceOrder.createdAt)}</span>
          </div>
          {serviceOrder.completedAt && (
            <div className="row">
              <span>Selesai:</span>
              <span>{formatDate(serviceOrder.completedAt)}</span>
            </div>
          )}
        </div>

        {/* Customer Info */}
        <div className="section">
          <div className="section-title">PELANGGAN</div>
          <div className="row">
            <span>Nama:</span>
            <span>{serviceOrder.customerName}</span>
          </div>
          <div className="row">
            <span>Telepon:</span>
            <span>{serviceOrder.customerPhone}</span>
          </div>
        </div>

        {/* Item Info */}
        <div className="section">
          <div className="section-title">BARANG SERVICE</div>
          <div className="row">
            <span>Barang:</span>
          </div>
          <div style={{ marginLeft: '10px', fontSize: '10px', marginBottom: '3px' }}>
            {serviceOrder.itemDescription}
          </div>
          <div className="row">
            <span>Masalah:</span>
          </div>
          <div style={{ marginLeft: '10px', fontSize: '10px' }}>
            {serviceOrder.problemDescription}
          </div>
        </div>

        {/* Service Details */}
        <div className="section">
          <div className="section-title">DETAIL JASA SERVICE</div>
          <div className="item">
            <div className="item-info">
              <div className="item-name">{serviceOrder.service?.name || 'Jasa Service'}</div>
              <div className="item-detail">{serviceOrder.service?.description || ''}</div>
            </div>
            <div className="item-price">
              {formatCurrency(serviceOrder.finalPrice || 0)}
            </div>
          </div>
        </div>

        {/* Spareparts */}
        {serviceOrder.spareparts && serviceOrder.spareparts.length > 0 && (
          <div className="section">
            <div className="section-title">SPAREPART</div>
            {serviceOrder.spareparts.map((sp: any, idx: number) => (
              <div key={idx} className="item">
                <div className="item-info">
                  <div className="item-name">{sp.variant?.variantName || 'Sparepart'}</div>
                  <div className="item-detail">
                    {sp.variant?.product?.name || ''} - {sp.quantity} x {formatCurrency(sp.price)}
                  </div>
                </div>
                <div className="item-price">
                  {formatCurrency(sp.price * sp.quantity)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payment */}
        <div className="total-section">
          <div className="total-row">
            <span>Jasa Service:</span>
            <span>{formatCurrency(serviceOrder.finalPrice || 0)}</span>
          </div>
          {serviceOrder.sparepartsTotal > 0 && (
            <div className="total-row">
              <span>Sparepart:</span>
              <span>{formatCurrency(serviceOrder.sparepartsTotal)}</span>
            </div>
          )}
          <div className="total-row">
            <span>DP:</span>
            <span>- {formatCurrency(serviceOrder.dpAmount || 0)}</span>
          </div>
          <div className="total-row final">
            <span>TOTAL BAYAR:</span>
            <span>{formatCurrency(Math.max(0, remainingPayment))}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <div className="thank-you">Terima Kasih</div>
          <div className="validity">Struk ini sebagai bukti pembayaran yang sah</div>
        </div>
      </div>
    </div>
  );
}
