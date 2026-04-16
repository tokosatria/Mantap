'use client';

import { Order } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface PrintReceiptProps {
  order: Order;
  onClose: () => void;
}

const STORE_INFO = {
  name: 'Satria Elektronik',
  address: 'Jl Batalyon 323 Buaya Putih',
  address2: 'Gerbang Pertama Batalyon',
  address3: 'Kel/Kec Purwaharja Rt 23 Rw 11',
  whatsapp: '083895603395',
};

export default function PrintReceipt({ order, onClose }: PrintReceiptProps) {
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
            <title>Struk Belanja - ${order.orderNumber}</title>
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
              .order-info {
                border-bottom: 1px dashed #000;
                padding-bottom: 10px;
                margin-bottom: 10px;
              }
              .order-info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 3px;
                font-size: 11px;
              }
              .items {
                margin-bottom: 10px;
              }
              .item {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 5px;
                font-size: 11px;
              }
              .item-info {
                flex: 1;
                padding-right: 5px;
              }
              .item-name {
                font-weight: bold;
              }
              .item-variant {
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
                padding: 10px 0;
                margin-bottom: 10px;
              }
              .total-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 3px;
                font-size: 12px;
                font-weight: bold;
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
              .qris-section {
                text-align: center;
                margin: 10px 0;
              }
              .qris-label {
                font-size: 10px;
                margin-bottom: 5px;
                font-weight: bold;
              }
              .qris-image {
                width: 150px;
                height: 150px;
                object-fit: contain;
                margin: 0 auto;
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
        <div className="order-info">
          <div className="order-info-row">
            <span>No. Pesanan:</span>
            <span>{order.orderNumber}</span>
          </div>
          <div className="order-info-row">
            <span>Tanggal:</span>
            <span>{formatDate(order.createdAt)}</span>
          </div>
          <div className="order-info-row">
            <span>Pembeli:</span>
            <span>{order.user?.nama || '-'}</span>
          </div>
          <div className="order-info-row">
            <span>WhatsApp:</span>
            <span>{order.user?.noWhatsapp || '-'}</span>
          </div>
        </div>

        {/* Items */}
        <div className="items">
          {order.items?.map((item: any, idx: number) => (
            <div key={idx} className="item">
              <div className="item-info">
                <div className="item-name">{item.variant?.product?.name || 'Produk'}</div>
                <div className="item-variant">{item.variant?.variantName || ''}</div>
                <div>{item.quantity} x {formatCurrency(item.price)}</div>
              </div>
              <div className="item-price">
                {formatCurrency(item.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="total-section">
          <div className="total-row">
            <span>TOTAL</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <div className="qris-section">
            <div className="qris-label">SCAN QRIS UNTUK PEMBAYARAN</div>
            <img
              src="/qris-dana.jpeg"
              alt="QRIS Dana"
              className="qris-image"
            />
            <div className="validity" style={{ marginTop: '5px' }}>
              Scan QRIS di atas untuk pembayaran via Dana
            </div>
          </div>
          <div className="thank-you">Terima Kasih</div>
          <div className="validity">Struk ini sebagai bukti pembayaran yang sah</div>
        </div>
      </div>
    </div>
  );
}
