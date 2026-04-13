'use client';

import { useEffect, useState, useRef } from 'react';
import { Order, Product } from '@/types';
import { FileText, Printer, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function ReportsTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceOrders, setServiceOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('transactions'); // transactions, profit-loss, master-products, fast-moving
  const [reportPeriod, setReportPeriod] = useState('today');
  const [printProfitLoss, setPrintProfitLoss] = useState(false);
  const [printMasterProducts, setPrintMasterProducts] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const printMasterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, serviceOrdersRes, productsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/service-orders'),
        fetch('/api/products'),
      ]);
      const ordersData = await ordersRes.json();
      const serviceOrdersData = await serviceOrdersRes.json();
      const productsData = await productsRes.json();
      if (ordersData.success) setOrders(ordersData.data);
      if (serviceOrdersData.success) setServiceOrders(serviceOrdersData.data);
      if (productsData.success) setProducts(productsData.data);
    } catch (error) {
      console.error('Fetch data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    const now = new Date();
    let filteredOrders = orders;
    let filteredServiceOrders = serviceOrders;

    // Filter by period
    switch (reportPeriod) {
      case 'today':
        filteredOrders = orders.filter(o => {
          const orderDate = new Date(o.createdAt);
          return orderDate.toDateString() === now.toDateString();
        });
        filteredServiceOrders = serviceOrders.filter(o => {
          const orderDate = new Date(o.createdAt);
          return orderDate.toDateString() === now.toDateString();
        });
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredOrders = orders.filter(o => new Date(o.createdAt) >= weekAgo);
        filteredServiceOrders = serviceOrders.filter(o => new Date(o.createdAt) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
        filteredOrders = orders.filter(o => new Date(o.createdAt) >= monthAgo);
        filteredServiceOrders = serviceOrders.filter(o => new Date(o.createdAt) >= monthAgo);
        break;
      case 'year':
        const yearAgo = new Date(now.getFullYear(), 0, 1);
        filteredOrders = orders.filter(o => new Date(o.createdAt) >= yearAgo);
        filteredServiceOrders = serviceOrders.filter(o => new Date(o.createdAt) >= yearAgo);
        break;
      case 'all':
        // No filter
        break;
    }

    return { filteredOrders, filteredServiceOrders };
  };

  const exportReport = () => {
    const { filteredOrders, filteredServiceOrders } = getFilteredData();

    // Helper function to format currency for CSV (without non-breaking space)
    const formatCurrencyCSV = (value: number): string => {
      // Format: Rp 1.234.567 (using regular space, not NBSP)
      return `Rp ${value.toLocaleString('id-ID')}`;
    };

    // Generate CSV content
    let csvContent = '\uFEFF'; // BOM for UTF-8

    // Export untuk Laba Rugi
    if (reportType === 'profit-loss') {
      // Header dengan Kop Perusahaan
      csvContent += 'SATRIA ELEKTRONIK\n';
      csvContent += 'LAPORAN LABA RUGI\n';
      csvContent += `Periode: ${getPeriodLabel()}\n`;
      csvContent += `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
      csvContent += '\n';

      // Column headers
      csvContent += 'No,Jenis,Produk,Varian,Jumlah,Harga,HPP,Revenue,Laba,Margin\n';

      // Calculate profit/loss data
      const completedProductOrders = filteredOrders.filter(o => o.status === 'completed');
      const completedServiceOrders = filteredServiceOrders.filter(o => o.status === 'completed');

      const profitLossData: any[] = [];
      let totalRevenue = 0;
      let totalHPP = 0;

      // Product orders
      completedProductOrders.forEach(order => {
        (order.items || []).forEach((item: any) => {
          const variant = item.variant;
          const hpp = variant?.hpp || 0;
          const quantity = item.quantity;
          const itemHPP = hpp * quantity;
          const itemRevenue = item.price * quantity;
          const itemProfit = itemRevenue - itemHPP;
          const margin = itemRevenue > 0 ? ((itemProfit / itemRevenue) * 100) : 0;

          totalRevenue += itemRevenue;
          totalHPP += itemHPP;

          profitLossData.push({
            type: 'Produk',
            productName: variant?.product?.name || '-',
            variantName: variant?.variantName || '-',
            quantity,
            price: item.price,
            hpp,
            revenue: itemRevenue,
            profit: itemProfit,
            margin,
          });
        });
      });

      // Service orders
      completedServiceOrders.forEach(order => {
        // Service fee - 100% profit
        const serviceFee = order.finalPrice || 0;
        if (serviceFee > 0) {
          totalRevenue += serviceFee;
          profitLossData.push({
            type: 'Jasa',
            productName: `${order.service?.name} - ${order.itemDescription || '-'}`,
            variantName: 'Jasa Service',
            quantity: 1,
            price: serviceFee,
            hpp: 0,
            revenue: serviceFee,
            profit: serviceFee,
            margin: 100,
          });
        }

        // Spareparts
        (order.spareparts || []).forEach((sp: any) => {
          const variant = sp.variant;
          const hpp = variant?.hpp || 0;
          const quantity = sp.quantity;
          const itemHPP = hpp * quantity;
          const itemRevenue = sp.price * quantity;
          const itemProfit = itemRevenue - itemHPP;
          const margin = itemRevenue > 0 ? ((itemProfit / itemRevenue) * 100) : 0;

          totalRevenue += itemRevenue;
          totalHPP += itemHPP;

          profitLossData.push({
            type: 'Sparepart',
            productName: variant?.product?.name || '-',
            variantName: variant?.variantName || '-',
            quantity,
            price: sp.price,
            hpp,
            revenue: itemRevenue,
            profit: itemProfit,
            margin,
          });
        });
      });

      // Write data rows
      profitLossData.forEach((item, idx) => {
        csvContent += `"${idx + 1}","${item.type}","${item.productName}","${item.variantName}","${item.quantity}","${formatCurrencyCSV(item.price)}","${formatCurrencyCSV(item.hpp)}","${formatCurrencyCSV(item.revenue)}","${formatCurrencyCSV(item.profit)}","${item.margin.toFixed(1)}%"\n`;
      });

      // Summary
      const totalProfit = totalRevenue - totalHPP;
      const overallMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;

      csvContent += '\n';
      csvContent += '"RINGKASAN","","","","","","","","","",""\n';
      csvContent += `"TOTAL REVENUE","","","","","","","","${formatCurrencyCSV(totalRevenue)}",""\n`;
      csvContent += `"TOTAL HPP (MODAL)","","","","","","","","${formatCurrencyCSV(totalHPP)}",""\n`;
      csvContent += `"TOTAL LABA","","","","","","","","${formatCurrencyCSV(totalProfit)}","${overallMargin.toFixed(1)}%"\n`;
    } else if (reportType === 'transactions') {
      // Export untuk Transaksi
      // Header dengan Kop Perusahaan
      csvContent += 'SATRIA ELEKTRONIK\n';
      csvContent += 'LAPORAN TRANSAKSI\n';
      csvContent += `Jenis Laporan: ${getReportTypeLabel()}\n`;
      csvContent += `Periode: ${getPeriodLabel()}\n`;
      csvContent += `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
      csvContent += '\n';

      // Column headers
      csvContent += 'Tanggal,Nomor,Customer/Pelanggan,Jenis,Produk,Varian,Jumlah,Harga,Total\n';

      // Process product orders - one row per item
      filteredOrders.forEach(order => {
        if (order.status !== 'completed') return;

        const date = new Date(order.createdAt).toLocaleDateString('id-ID');
        const customerName = order.user?.nama || '-';

        // Create one row per item
        (order.items || []).forEach((item: any) => {
          const productName = item.variant?.product?.name || '-';
          const variantName = item.variant?.variantName || '-';
          const quantity = item.quantity;
          const price = item.price;
          const total = item.price * item.quantity;

          csvContent += `"${date}","${order.orderNumber}","${customerName}","PESANAN PRODUK","${productName}","${variantName}","${quantity}","${formatCurrencyCSV(price)}","${formatCurrencyCSV(total)}"\n`;
        });
      });

      // Process service orders
      filteredServiceOrders.forEach(serviceOrder => {
        if (serviceOrder.status !== 'completed') return;

        const date = new Date(serviceOrder.createdAt).toLocaleDateString('id-ID');
        const customerName = serviceOrder.customerName || '-';

        // Add service fee row
        const serviceItem = `${serviceOrder.service?.name} - ${serviceOrder.itemDescription || '-'}`;
        const serviceTotal = serviceOrder.finalPrice || 0;

        csvContent += `"${date}","${serviceOrder.orderNumber || '-'}","${customerName}","JASA SERVICE","${serviceItem}","-","1","-","${formatCurrencyCSV(serviceTotal)}"\n`;

        // Add spareparts rows if any
        if (serviceOrder.spareparts && serviceOrder.spareparts.length > 0) {
          serviceOrder.spareparts.forEach((sp: any) => {
            const productName = sp.variant?.product?.name || '-';
            const variantName = sp.variant?.variantName || '-';
            const quantity = sp.quantity;
            const price = sp.price;
            const total = price * quantity;

            csvContent += `"${date}","${serviceOrder.orderNumber || '-'}","${customerName}","SPAREPART SERVICE","${productName}","${variantName}","${quantity}","${formatCurrencyCSV(price)}","${formatCurrencyCSV(total)}"\n`;
          });
        }
      });

      // Summary section
      const productRevenue = filteredOrders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.totalAmount, 0);

      const serviceRevenue = filteredServiceOrders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => {
          const serviceFee = o.finalPrice || 0;
          const sparepartsTotal = o.sparepartsTotal || o.spareparts?.reduce((total: number, sp: any) => total + (sp.price * sp.quantity), 0) || 0;
          return sum + serviceFee + sparepartsTotal;
        }, 0);

      csvContent += '\n';
      csvContent += '"RINGKASAN","","","","","","","","",""\n';
      csvContent += `"Total Revenue Produk","","","","","","","","${formatCurrencyCSV(productRevenue)}"\n`;
      csvContent += `"Total Revenue Service","","","","","","","","${formatCurrencyCSV(serviceRevenue)}"\n`;
      csvContent += `"TOTAL REVENUE","","","","","","","","${formatCurrencyCSV(productRevenue + serviceRevenue)}"\n`;
    } else if (reportType === 'master-products') {
      // Export untuk Master Products
      csvContent += 'SATRIA ELEKTRONIK\n';
      csvContent += 'MASTER PRODUCTS - DAFTAR HARGA & MARGIN\n';
      csvContent += `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
      csvContent += '\n';

      // Column headers
      csvContent += 'No,Produk,Varian,Harga Jual,HPP (Modal),Laba,Margin\n';

      // Generate master products data
      const masterData: any[] = [];
      let totalMasterRevenue = 0;
      let totalMasterHPP = 0;
      let totalMasterProfit = 0;

      products.forEach(product => {
        (product.variants || []).forEach((variant: any) => {
          const price = variant.price || 0;
          const hpp = variant.hpp || 0;
          const profit = price - hpp;
          const margin = price > 0 ? ((profit / price) * 100) : 0;

          totalMasterRevenue += price;
          totalMasterHPP += hpp;
          totalMasterProfit += profit;

          masterData.push({
            productName: product.name,
            variantName: variant.variantName || '-',
            price,
            hpp,
            profit,
            margin,
          });
        });
      });

      // Write data rows
      masterData.forEach((item, idx) => {
        csvContent += `"${idx + 1}","${item.productName}","${item.variantName}","${formatCurrencyCSV(item.price)}","${formatCurrencyCSV(item.hpp)}","${formatCurrencyCSV(item.profit)}","${item.margin.toFixed(1)}%"\n`;
      });

      // Summary
      const overallMargin = totalMasterRevenue > 0 ? ((totalMasterProfit / totalMasterRevenue) * 100) : 0;

      csvContent += '\n';
      csvContent += '"RINGKASAN","","","","","","",""\n';
      csvContent += `"TOTAL HARGA JUAL","","","","","","${formatCurrencyCSV(totalMasterRevenue)}",""\n`;
      csvContent += `"TOTAL MODAL (HPP)","","","","","","${formatCurrencyCSV(totalMasterHPP)}",""\n`;
      csvContent += `"TOTAL POTENSI LABA","","","","","","${formatCurrencyCSV(totalMasterProfit)}","${overallMargin.toFixed(1)}%"\n`;
    } else if (reportType === 'fast-moving') {
      // Export untuk Fast Moving Products
      csvContent += 'SATRIA ELEKTRONIK\n';
      csvContent += 'PRODUK LAKU KERAS (FAST MOVING)\n';
      csvContent += `Periode: ${getPeriodLabel()}\n`;
      csvContent += `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
      csvContent += '\n';

      // Column headers
      csvContent += 'Rank,Nama Produk,Terjual,Revenue\n';

      // Calculate fast moving data from filtered orders
      const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};

      filteredOrders.forEach(order => {
        if (order.status !== 'completed') return;

        order.items?.forEach((item: any) => {
          const productName = item.variant?.product?.name || 'Unknown';
          if (!productSales[productName]) {
            productSales[productName] = { name: productName, quantity: 0, revenue: 0 };
          }
          productSales[productName].quantity += item.quantity;
          productSales[productName].revenue += item.price * item.quantity;
        });
      });

      const sortedProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

      // Calculate totals
      const totalQuantity = sortedProducts.reduce((sum, p) => sum + p.quantity, 0);
      const totalRevenue = sortedProducts.reduce((sum, p) => sum + p.revenue, 0);

      // Write data rows
      sortedProducts.forEach((product, idx) => {
        csvContent += `"${idx + 1}","${product.name}","${product.quantity}","${formatCurrencyCSV(product.revenue)}"\n`;
      });

      // Summary
      csvContent += '\n';
      csvContent += '"RINGKASAN","","","",""\n';
      csvContent += `"TOTAL QUANTITY TERJUAL","","${totalQuantity}",""\n`;
      csvContent += `"TOTAL REVENUE","","","${formatCurrencyCSV(totalRevenue)}"\n`;
    }

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Satria_Elektronik_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getReportTypeLabel = () => {
    switch (reportType) {
      case 'transactions': return 'LAPORAN TRANSAKSI';
      case 'profit-loss': return 'LAPORAN LABA RUGI';
      case 'master-products': return 'MASTER PRODUCTS - DAFTAR HARGA';
      case 'fast-moving': return 'PRODUK LAKU KERAS';
      default: return 'LAPORAN';
    }
  };

  const getPeriodLabel = () => {
    switch (reportPeriod) {
      case 'today': return 'HARI INI';
      case 'week': return 'MINGGU INI';
      case 'month': return 'BULAN INI';
      case 'year': return 'TAHUN INI';
      case 'all': return 'SEMUA WAKTU';
      default: return '-';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Menunggu',
      confirmed: 'Dikonfirmasi',
      paid: 'Sudah Bayar',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    };
    return labels[status] || status;
  };

  const getServiceStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Menunggu',
      in_progress: 'Dalam Pengerjaan',
      dp_paid: 'DP Dibayar',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    };
    return labels[status] || status;
  };

  const generateDailyReport = () => {
    const { filteredOrders, filteredServiceOrders } = getFilteredData();

    // Flatten product orders - one row per item
    const productRows = filteredOrders
      .filter(o => o.status === 'completed')
      .flatMap(order => {
        return (order.items || []).map((item: any) => ({
          type: 'product',
          date: new Date(order.createdAt),
          orderNumber: order.orderNumber,
          customer: order.user?.nama || '-',
          item: item.variant?.product?.name || '-',
          variant: item.variant?.variantName || '-',
          quantity: item.quantity,
          price: item.price,
          status: getStatusLabel(order.status),
          total: item.price * item.quantity,
        }));
      });

    // Flatten service orders - include service fee and each sparepart as separate rows
    const serviceRows: any[] = [];
    filteredServiceOrders
      .filter(o => o.status === 'completed')
      .forEach(o => {
        // Add service fee row
        serviceRows.push({
          type: 'service',
          date: new Date(o.createdAt),
          orderNumber: o.orderNumber || '-',
          customer: o.customerName || '-',
          item: `${o.service?.name} - ${o.itemDescription || '-'}`,
          variant: '-',
          quantity: 1,
          price: o.finalPrice || 0,
          status: getServiceStatusLabel(o.status),
          total: o.finalPrice || 0,
        });

        // Add sparepart rows if any
        if (o.spareparts && o.spareparts.length > 0) {
          o.spareparts.forEach((sp: any) => {
            serviceRows.push({
              type: 'sparepart',
              date: new Date(o.createdAt),
              orderNumber: o.orderNumber || '-',
              customer: o.customerName || '-',
              item: sp.variant?.product?.name || '-',
              variant: sp.variant?.variantName || '-',
              quantity: sp.quantity,
              price: sp.price,
              status: getServiceStatusLabel(o.status),
              total: sp.price * sp.quantity,
            });
          });
        }
      });

    // Combine and sort by date
    const allTransactions = [...productRows, ...serviceRows].sort((a, b) =>
      b.date.getTime() - a.date.getTime()
    );

    // Calculate totals
    const productRevenue = filteredOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const serviceRevenue = filteredServiceOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => {
        const serviceFee = o.finalPrice || 0;
        const sparepartsTotal = o.sparepartsTotal || o.spareparts?.reduce((total: number, sp: any) => total + (sp.price * sp.quantity), 0) || 0;
        return sum + serviceFee + sparepartsTotal;
      }, 0);

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <p className="text-sm text-[var(--text-muted)]">Total Revenue Produk</p>
            <p className="text-2xl font-bold text-blue-400">{formatCurrency(productRevenue)}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-[var(--text-muted)]">Total Revenue Service</p>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(serviceRevenue)}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-[var(--text-muted)]">Total Revenue</p>
            <p className="text-2xl font-bold text-purple-400">{formatCurrency(productRevenue + serviceRevenue)}</p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]">
            <h4 className="font-semibold">Detail Transaksi</h4>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="data-table">
              <thead className="sticky top-0 bg-[var(--bg-elevated)] z-10">
                <tr>
                  <th>Tanggal</th>
                  <th>Nomor</th>
                  <th>Pelanggan</th>
                  <th>Jenis</th>
                  <th>Produk</th>
                  <th>Varian</th>
                  <th>Jumlah</th>
                  <th>Harga</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {allTransactions.length > 0 ? (
                  allTransactions.map((tx, idx) => (
                    <tr key={idx}>
                      <td>{tx.date.toLocaleDateString('id-ID')}</td>
                      <td className="font-mono text-sm">{tx.orderNumber}</td>
                      <td>{tx.customer}</td>
                      <td>
                        <span className={`badge ${
                          tx.type === 'product' ? 'badge-info' :
                          tx.type === 'service' ? 'badge-success' :
                          'badge-warning'
                        }`}>
                          {tx.type === 'product' ? 'Produk' : tx.type === 'service' ? 'Jasa' : 'Sparepart'}
                        </span>
                      </td>
                      <td className="font-medium">{tx.item}</td>
                      <td className="text-sm text-[var(--text-muted)]">{tx.variant}</td>
                      <td className="text-center font-bold text-blue-400">{tx.quantity}</td>
                      <td>{formatCurrency(tx.price)}</td>
                      <td className="font-bold">{formatCurrency(tx.total)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-[var(--text-muted)]">
                      Tidak ada transaksi dalam periode ini
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const generateMonthlyReport = () => {
    const { filteredOrders, filteredServiceOrders } = getFilteredData();

    // Flatten product orders - one row per item
    const productRows = filteredOrders
      .filter(o => o.status === 'completed')
      .flatMap(order => {
        const orderDate = new Date(order.createdAt);
        return (order.items || []).map((item: any) => ({
          type: 'product',
          date: orderDate,
          monthKey: `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`,
          orderNumber: order.orderNumber,
          customer: order.user?.nama || '-',
          item: item.variant?.product?.name || '-',
          variant: item.variant?.variantName || '-',
          quantity: item.quantity,
          price: item.price,
          status: getStatusLabel(order.status),
          total: item.price * item.quantity,
        }));
      });

    // Flatten service orders - include service fee and each sparepart as separate rows
    const serviceRows: any[] = [];
    filteredServiceOrders
      .filter(o => o.status === 'completed')
      .forEach(o => {
        const orderDate = new Date(o.createdAt);
        const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;

        // Add service fee row
        serviceRows.push({
          type: 'service',
          date: orderDate,
          monthKey,
          orderNumber: o.orderNumber || '-',
          customer: o.customerName || '-',
          item: `${o.service?.name} - ${o.itemDescription || '-'}`,
          variant: '-',
          quantity: 1,
          price: o.finalPrice || 0,
          status: getServiceStatusLabel(o.status),
          total: o.finalPrice || 0,
        });

        // Add sparepart rows if any
        if (o.spareparts && o.spareparts.length > 0) {
          o.spareparts.forEach((sp: any) => {
            serviceRows.push({
              type: 'sparepart',
              date: orderDate,
              monthKey,
              orderNumber: o.orderNumber || '-',
              customer: o.customerName || '-',
              item: sp.variant?.product?.name || '-',
              variant: sp.variant?.variantName || '-',
              quantity: sp.quantity,
              price: sp.price,
              status: getServiceStatusLabel(o.status),
              total: sp.price * sp.quantity,
            });
          });
        }
      });

    // Combine and sort by date
    const allTransactions = [...productRows, ...serviceRows].sort((a, b) =>
      b.date.getTime() - a.date.getTime()
    );

    // Group by month for summary
    const monthlySummary: Record<string, { productRevenue: number; serviceRevenue: number; count: number }> = {};
    allTransactions.forEach(tx => {
      if (!monthlySummary[tx.monthKey]) {
        monthlySummary[tx.monthKey] = { productRevenue: 0, serviceRevenue: 0, count: 0 };
      }
      if (tx.type === 'product') {
        monthlySummary[tx.monthKey].productRevenue += tx.total;
      } else {
        // service and sparepart both counted as service revenue
        monthlySummary[tx.monthKey].serviceRevenue += tx.total;
      }
      monthlySummary[tx.monthKey].count++;
    });

    const productRevenue = filteredOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const serviceRevenue = filteredServiceOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => {
        const serviceFee = o.finalPrice || 0;
        const sparepartsTotal = o.sparepartsTotal || o.spareparts?.reduce((total: number, sp: any) => total + (sp.price * sp.quantity), 0) || 0;
        return sum + serviceFee + sparepartsTotal;
      }, 0);

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <p className="text-sm text-[var(--text-muted)]">Total Revenue Produk</p>
            <p className="text-2xl font-bold text-blue-400">{formatCurrency(productRevenue)}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-[var(--text-muted)]">Total Revenue Service</p>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(serviceRevenue)}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-[var(--text-muted)]">Total Revenue</p>
            <p className="text-2xl font-bold text-purple-400">{formatCurrency(productRevenue + serviceRevenue)}</p>
          </div>
        </div>

        {/* Monthly Summary Table */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]">
            <h4 className="font-semibold">Ringkasan Per Bulan</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bulan</th>
                  <th>Jumlah Transaksi</th>
                  <th>Revenue Produk</th>
                  <th>Revenue Service</th>
                  <th>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(monthlySummary)
                  .sort((a, b) => b[0].localeCompare(a[0]))
                  .map(([month, data]) => (
                    <tr key={month}>
                      <td>{month}</td>
                      <td>{data.count}</td>
                      <td className="font-semibold text-blue-400">{formatCurrency(data.productRevenue)}</td>
                      <td className="font-semibold text-green-400">{formatCurrency(data.serviceRevenue)}</td>
                      <td className="font-bold">{formatCurrency(data.productRevenue + data.serviceRevenue)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* All Transactions Table */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]">
            <h4 className="font-semibold">Detail Semua Transaksi</h4>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="data-table">
              <thead className="sticky top-0 bg-[var(--bg-elevated)] z-10">
                <tr>
                  <th>Bulan</th>
                  <th>Tanggal</th>
                  <th>Nomor</th>
                  <th>Pelanggan</th>
                  <th>Jenis</th>
                  <th>Produk</th>
                  <th>Varian</th>
                  <th>Jumlah</th>
                  <th>Harga</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {allTransactions.length > 0 ? (
                  allTransactions.map((tx, idx) => (
                    <tr key={idx}>
                      <td>{tx.monthKey}</td>
                      <td>{tx.date.toLocaleDateString('id-ID')}</td>
                      <td className="font-mono text-sm">{tx.orderNumber}</td>
                      <td>{tx.customer}</td>
                      <td>
                        <span className={`badge ${
                          tx.type === 'product' ? 'badge-info' :
                          tx.type === 'service' ? 'badge-success' :
                          'badge-warning'
                        }`}>
                          {tx.type === 'product' ? 'Produk' : tx.type === 'service' ? 'Jasa' : 'Sparepart'}
                        </span>
                      </td>
                      <td className="font-medium">{tx.item}</td>
                      <td className="text-sm text-[var(--text-muted)]">{tx.variant}</td>
                      <td className="text-center font-bold text-blue-400">{tx.quantity}</td>
                      <td>{formatCurrency(tx.price)}</td>
                      <td className="font-bold">{formatCurrency(tx.total)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-[var(--text-muted)]">
                      Tidak ada transaksi dalam periode ini
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const generateYearlyReport = () => {
    const { filteredOrders, filteredServiceOrders } = getFilteredData();

    // Flatten product orders - one row per item
    const productRows = filteredOrders
      .filter(o => o.status === 'completed')
      .flatMap(order => {
        const orderDate = new Date(order.createdAt);
        return (order.items || []).map((item: any) => ({
          type: 'product',
          date: orderDate,
          year: orderDate.getFullYear().toString(),
          orderNumber: order.orderNumber,
          customer: order.user?.nama || '-',
          item: item.variant?.product?.name || '-',
          variant: item.variant?.variantName || '-',
          quantity: item.quantity,
          price: item.price,
          status: getStatusLabel(order.status),
          total: item.price * item.quantity,
        }));
      });

    // Flatten service orders - include service fee and each sparepart as separate rows
    const serviceRows: any[] = [];
    filteredServiceOrders
      .filter(o => o.status === 'completed')
      .forEach(o => {
        const orderDate = new Date(o.createdAt);
        const year = orderDate.getFullYear().toString();

        // Add service fee row
        serviceRows.push({
          type: 'service',
          date: orderDate,
          year,
          orderNumber: o.orderNumber || '-',
          customer: o.customerName || '-',
          item: `${o.service?.name} - ${o.itemDescription || '-'}`,
          variant: '-',
          quantity: 1,
          price: o.finalPrice || 0,
          status: getServiceStatusLabel(o.status),
          total: o.finalPrice || 0,
        });

        // Add sparepart rows if any
        if (o.spareparts && o.spareparts.length > 0) {
          o.spareparts.forEach((sp: any) => {
            serviceRows.push({
              type: 'sparepart',
              date: orderDate,
              year,
              orderNumber: o.orderNumber || '-',
              customer: o.customerName || '-',
              item: sp.variant?.product?.name || '-',
              variant: sp.variant?.variantName || '-',
              quantity: sp.quantity,
              price: sp.price,
              status: getServiceStatusLabel(o.status),
              total: sp.price * sp.quantity,
            });
          });
        }
      });

    // Combine and sort by date
    const allTransactions = [...productRows, ...serviceRows].sort((a, b) =>
      b.date.getTime() - a.date.getTime()
    );

    // Group by year for summary
    const yearlySummary: Record<string, { productRevenue: number; serviceRevenue: number; count: number }> = {};
    allTransactions.forEach(tx => {
      if (!yearlySummary[tx.year]) {
        yearlySummary[tx.year] = { productRevenue: 0, serviceRevenue: 0, count: 0 };
      }
      if (tx.type === 'product') {
        yearlySummary[tx.year].productRevenue += tx.total;
      } else {
        // service and sparepart both counted as service revenue
        yearlySummary[tx.year].serviceRevenue += tx.total;
      }
      yearlySummary[tx.year].count++;
    });

    const productRevenue = filteredOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const serviceRevenue = filteredServiceOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => {
        const serviceFee = o.finalPrice || 0;
        const sparepartsTotal = o.sparepartsTotal || o.spareparts?.reduce((total: number, sp: any) => total + (sp.price * sp.quantity), 0) || 0;
        return sum + serviceFee + sparepartsTotal;
      }, 0);

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <p className="text-sm text-[var(--text-muted)]">Total Revenue Produk</p>
            <p className="text-2xl font-bold text-blue-400">{formatCurrency(productRevenue)}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-[var(--text-muted)]">Total Revenue Service</p>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(serviceRevenue)}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-[var(--text-muted)]">Total Revenue</p>
            <p className="text-2xl font-bold text-purple-400">{formatCurrency(productRevenue + serviceRevenue)}</p>
          </div>
        </div>

        {/* Yearly Summary Table */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]">
            <h4 className="font-semibold">Ringkasan Per Tahun</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tahun</th>
                  <th>Jumlah Transaksi</th>
                  <th>Revenue Produk</th>
                  <th>Revenue Service</th>
                  <th>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(yearlySummary)
                  .sort((a, b) => b[0].localeCompare(a[0]))
                  .map(([year, data]) => (
                    <tr key={year}>
                      <td>{year}</td>
                      <td>{data.count}</td>
                      <td className="font-semibold text-blue-400">{formatCurrency(data.productRevenue)}</td>
                      <td className="font-semibold text-green-400">{formatCurrency(data.serviceRevenue)}</td>
                      <td className="font-bold">{formatCurrency(data.productRevenue + data.serviceRevenue)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* All Transactions Table */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]">
            <h4 className="font-semibold">Detail Semua Transaksi</h4>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="data-table">
              <thead className="sticky top-0 bg-[var(--bg-elevated)] z-10">
                <tr>
                  <th>Tahun</th>
                  <th>Tanggal</th>
                  <th>Nomor</th>
                  <th>Pelanggan</th>
                  <th>Jenis</th>
                  <th>Produk</th>
                  <th>Varian</th>
                  <th>Jumlah</th>
                  <th>Harga</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {allTransactions.length > 0 ? (
                  allTransactions.map((tx, idx) => (
                    <tr key={idx}>
                      <td>{tx.year}</td>
                      <td>{tx.date.toLocaleDateString('id-ID')}</td>
                      <td className="font-mono text-sm">{tx.orderNumber}</td>
                      <td>{tx.customer}</td>
                      <td>
                        <span className={`badge ${
                          tx.type === 'product' ? 'badge-info' :
                          tx.type === 'service' ? 'badge-success' :
                          'badge-warning'
                        }`}>
                          {tx.type === 'product' ? 'Produk' : tx.type === 'service' ? 'Jasa' : 'Sparepart'}
                        </span>
                      </td>
                      <td className="font-medium">{tx.item}</td>
                      <td className="text-sm text-[var(--text-muted)]">{tx.variant}</td>
                      <td className="text-center font-bold text-blue-400">{tx.quantity}</td>
                      <td>{formatCurrency(tx.price)}</td>
                      <td className="font-bold">{formatCurrency(tx.total)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-[var(--text-muted)]">
                      Tidak ada transaksi dalam periode ini
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const generateFastMovingReport = () => {
    const { filteredOrders } = getFilteredData();
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};

    filteredOrders.forEach(order => {
      if (order.status !== 'completed') return;

      order.items?.forEach((item: any) => {
        const productName = item.variant?.product?.name || 'Unknown';
        if (!productSales[productName]) {
          productSales[productName] = { name: productName, quantity: 0, revenue: 0 };
        }
        productSales[productName].quantity += item.quantity;
        productSales[productName].revenue += item.price * item.quantity;
      });
    });

    const sortedProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return (
      <div className="space-y-6">
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]">
            <h4 className="font-semibold">Top 10 Produk Laku Keras</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Nama Produk</th>
                  <th>Terjual</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.length > 0 ? (
                  sortedProducts.map((product, index) => (
                    <tr key={index}>
                      <td>#{index + 1}</td>
                      <td className="font-medium">{product.name}</td>
                      <td className="font-semibold">{product.quantity}</td>
                      <td className="font-semibold">{formatCurrency(product.revenue)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-[var(--text-muted)]">
                      Tidak ada data penjualan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const handlePrintProfitLoss = () => {
    setPrintProfitLoss(true);
    setTimeout(() => {
      if (printRef.current) {
        const printContent = printRef.current.innerHTML;
        const printWindow = window.open('', '', 'width=800,height=600');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Laporan Laba Rugi - Satria Elektronik</title>
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                body {
                  font-family: Arial, sans-serif;
                  font-size: 11px;
                  padding: 20px;
                  background: white;
                  color: black;
                }
                .header {
                  text-align: center;
                  margin-bottom: 20px;
                  border-bottom: 2px solid #000;
                  padding-bottom: 10px;
                }
                .store-name {
                  font-size: 18px;
                  font-weight: bold;
                  margin-bottom: 5px;
                }
                .report-title {
                  font-size: 14px;
                  font-weight: bold;
                  margin-bottom: 5px;
                }
                .report-date {
                  font-size: 11px;
                  color: #666;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 10px;
                }
                th, td {
                  border: 1px solid #000;
                  padding: 6px 8px;
                  text-align: left;
                }
                th {
                  background-color: #f0f0f0;
                  font-weight: bold;
                }
                .text-right {
                  text-align: right;
                }
                .text-center {
                  text-align: center;
                }
                .positive {
                  color: green;
                }
                .negative {
                  color: red;
                }
                .summary {
                  margin-top: 20px;
                  border: 2px solid #000;
                  padding: 10px;
                }
                .summary-row {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 5px;
                  font-size: 12px;
                  font-weight: bold;
                }
                .total-row {
                  border-top: 1px solid #000;
                  padding-top: 10px;
                  margin-top: 10px;
                  font-size: 13px;
                }
                .footer {
                  text-align: center;
                  margin-top: 30px;
                  color: #666;
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
      setPrintProfitLoss(false);
    }, 100);
  };

  const handlePrintMasterProducts = () => {
    setPrintMasterProducts(true);
    setTimeout(() => {
      if (printMasterRef.current) {
        const printContent = printMasterRef.current.innerHTML;
        const printWindow = window.open('', '', 'width=800,height=600');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Master Products - Satria Elektronik</title>
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                body {
                  font-family: Arial, sans-serif;
                  font-size: 11px;
                  padding: 20px;
                  background: white;
                  color: black;
                }
                .header {
                  text-align: center;
                  margin-bottom: 20px;
                  border-bottom: 2px solid #000;
                  padding-bottom: 10px;
                }
                .store-name {
                  font-size: 18px;
                  font-weight: bold;
                  margin-bottom: 5px;
                }
                .report-title {
                  font-size: 14px;
                  font-weight: bold;
                  margin-bottom: 5px;
                }
                .report-date {
                  font-size: 11px;
                  color: #666;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 10px;
                }
                th, td {
                  border: 1px solid #000;
                  padding: 6px 8px;
                  text-align: left;
                }
                th {
                  background-color: #f0f0f0;
                  font-weight: bold;
                }
                .text-right {
                  text-align: right;
                }
                .text-center {
                  text-align: center;
                }
                .positive {
                  color: green;
                }
                .negative {
                  color: red;
                }
                .footer {
                  text-align: center;
                  margin-top: 30px;
                  color: #666;
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
      setPrintMasterProducts(false);
    }, 100);
  };

  const generateProfitLossReport = () => {
    // Get filtered data based on selected period
    const { filteredOrders, filteredServiceOrders } = getFilteredData();

    // Calculate REAL revenue from completed transactions
    const completedProductOrders = filteredOrders.filter(o => o.status === 'completed');
    const completedServiceOrders = filteredServiceOrders.filter(o => o.status === 'completed');

    // Revenue from product sales
    const productRevenue = completedProductOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Revenue from service orders (service fee + spareparts)
    const serviceRevenue = completedServiceOrders.reduce((sum, order) => {
      const serviceFee = order.finalPrice || 0;
      const sparepartsTotal = order.sparepartsTotal || order.spareparts?.reduce((total: number, sp: any) => total + (sp.price * sp.quantity), 0) || 0;
      return sum + serviceFee + sparepartsTotal;
    }, 0);

    const totalRevenue = productRevenue + serviceRevenue;

    // Calculate REAL HPP from sold items
    let totalHPP = 0;
    const profitLossData: any[] = [];

    // HPP from product orders
    completedProductOrders.forEach(order => {
      (order.items || []).forEach((item: any) => {
        const variant = item.variant;
        const hpp = variant?.hpp || 0; // HPP dari variant
        const quantity = item.quantity;
        const itemHPP = hpp * quantity;
        const itemRevenue = item.price * quantity;
        const itemProfit = itemRevenue - itemHPP;
        const margin = itemRevenue > 0 ? ((itemProfit / itemRevenue) * 100) : 0;

        totalHPP += itemHPP;

        profitLossData.push({
          type: 'product',
          productName: variant?.product?.name || '-',
          variantName: variant?.variantName || '-',
          price: item.price,
          hpp,
          quantity,
          revenue: itemRevenue,
          profit: itemProfit,
          margin,
        });
      });
    });

    // HPP from service orders (only spareparts, service fee has no HPP)
    completedServiceOrders.forEach(order => {
      // Service fee row - 100% profit (no HPP for service)
      const serviceFee = order.finalPrice || 0;
      if (serviceFee > 0) {
        profitLossData.push({
          type: 'service',
          productName: `${order.service?.name} - ${order.itemDescription || '-'}`,
          variantName: 'Jasa Service',
          price: serviceFee,
          hpp: 0,
          quantity: 1,
          revenue: serviceFee,
          profit: serviceFee, // 100% profit untuk jasa
          margin: 100,
        });
      }

      // Spareparts HPP
      (order.spareparts || []).forEach((sp: any) => {
        const variant = sp.variant;
        const hpp = variant?.hpp || 0;
        const quantity = sp.quantity;
        const itemHPP = hpp * quantity;
        const itemRevenue = sp.price * quantity;
        const itemProfit = itemRevenue - itemHPP;
        const margin = itemRevenue > 0 ? ((itemProfit / itemRevenue) * 100) : 0;

        totalHPP += itemHPP;

        profitLossData.push({
          type: 'sparepart',
          productName: variant?.product?.name || '-',
          variantName: variant?.variantName || '-',
          price: sp.price,
          hpp,
          quantity,
          revenue: itemRevenue,
          profit: itemProfit,
          margin,
        });
      });
    });

    const totalProfit = totalRevenue - totalHPP;
    const overallMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-sm text-[var(--text-muted)]">Total Revenue</p>
            <p className="text-2xl font-bold text-blue-400">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-[var(--text-muted)]">Total HPP (Modal)</p>
            <p className="text-2xl font-bold text-red-400">{formatCurrency(totalHPP)}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-[var(--text-muted)]">Total Laba</p>
            <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(totalProfit)}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-[var(--text-muted)]">Margin Rata-rata</p>
            <p className={`text-2xl font-bold ${overallMargin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {overallMargin.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Profit/Loss Table */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-elevated)] flex items-center justify-between">
            <h4 className="font-semibold">Detail Laba Rugi</h4>
            <button
              onClick={handlePrintProfitLoss}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="data-table">
              <thead className="sticky top-0 bg-[var(--bg-elevated)] z-10">
                <tr>
                  <th>No</th>
                  <th>Jenis</th>
                  <th>Produk</th>
                  <th>Varian</th>
                  <th className="text-right">Jumlah</th>
                  <th className="text-right">Harga</th>
                  <th className="text-right">HPP</th>
                  <th className="text-right">Revenue</th>
                  <th className="text-right">Laba</th>
                  <th className="text-right">Margin</th>
                </tr>
              </thead>
              <tbody>
                {profitLossData.length > 0 ? (
                  profitLossData.map((item, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>
                        <span className={`badge ${
                          item.type === 'product' ? 'badge-info' :
                          item.type === 'service' ? 'badge-success' :
                          'badge-warning'
                        }`}>
                          {item.type === 'product' ? 'Produk' : item.type === 'service' ? 'Jasa' : 'Sparepart'}
                        </span>
                      </td>
                      <td className="font-medium">{item.productName}</td>
                      <td className="text-sm text-[var(--text-muted)]">{item.variantName}</td>
                      <td className="text-center font-bold">{item.quantity}</td>
                      <td className="text-right font-semibold">{formatCurrency(item.price)}</td>
                      <td className="text-right text-red-400">{formatCurrency(item.hpp)}</td>
                      <td className="text-right font-bold text-blue-400">{formatCurrency(item.revenue)}</td>
                      <td className={`text-right font-bold ${item.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(item.profit)}
                      </td>
                      <td className={`text-right ${item.margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {item.margin.toFixed(1)}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-[var(--text-muted)]">
                      Tidak ada transaksi dalam periode ini
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-[var(--bg-elevated)]">
                <tr>
                  <td colSpan={5} className="font-bold text-right">TOTAL</td>
                  <td className="text-right"></td>
                  <td className="text-right font-bold text-red-400">{formatCurrency(totalHPP)}</td>
                  <td className="text-right font-bold text-blue-400">{formatCurrency(totalRevenue)}</td>
                  <td className={`text-right font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(totalProfit)}
                  </td>
                  <td className={`text-right font-bold ${overallMargin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {overallMargin.toFixed(1)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const generateMasterProductsReport = () => {
    // Generate master products list with price, HPP, profit, margin
    const masterData: any[] = [];
    let totalMasterRevenue = 0;
    let totalMasterHPP = 0;
    let totalMasterProfit = 0;

    products.forEach(product => {
      (product.variants || []).forEach((variant: any) => {
        const price = variant.price || 0;
        const hpp = variant.hpp || 0;
        const profit = price - hpp;
        const margin = price > 0 ? ((profit / price) * 100) : 0;

        totalMasterRevenue += price;
        totalMasterHPP += hpp;
        totalMasterProfit += profit;

        masterData.push({
          productName: product.name,
          variantName: variant.variantName || '-',
          price,
          hpp,
          profit,
          margin,
        });
      });
    });

    const overallMargin = totalMasterRevenue > 0 ? ((totalMasterProfit / totalMasterRevenue) * 100) : 0;

    return (
      <div className="space-y-6" ref={printMasterRef}>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-sm text-[var(--text-muted)]">Total Harga Jual</p>
            <p className="text-2xl font-bold text-blue-400">{formatCurrency(totalMasterRevenue)}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-[var(--text-muted)]">Total Modal (HPP)</p>
            <p className="text-2xl font-bold text-red-400">{formatCurrency(totalMasterHPP)}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-[var(--text-muted)]">Total Potensi Laba</p>
            <p className={`text-2xl font-bold ${totalMasterProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(totalMasterProfit)}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-[var(--text-muted)]">Margin Rata-rata</p>
            <p className={`text-2xl font-bold ${overallMargin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {overallMargin.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Master Products Table */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-elevated)] flex items-center justify-between">
            <h4 className="font-semibold">Master Products (Daftar Harga & Margin)</h4>
            <button
              onClick={handlePrintMasterProducts}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="data-table">
              <thead className="sticky top-0 bg-[var(--bg-elevated)] z-10">
                <tr>
                  <th>No</th>
                  <th>Produk</th>
                  <th>Varian</th>
                  <th className="text-right">Harga Jual</th>
                  <th className="text-right">HPP (Modal)</th>
                  <th className="text-right">Laba</th>
                  <th className="text-right">Margin</th>
                </tr>
              </thead>
              <tbody>
                {masterData.length > 0 ? (
                  masterData.map((item, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td className="font-medium">{item.productName}</td>
                      <td className="text-sm text-[var(--text-muted)]">{item.variantName}</td>
                      <td className="text-right font-semibold">{formatCurrency(item.price)}</td>
                      <td className="text-right text-red-400">{formatCurrency(item.hpp)}</td>
                      <td className={`text-right font-bold ${item.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(item.profit)}
                      </td>
                      <td className={`text-right ${item.margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {item.margin.toFixed(1)}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[var(--text-muted)]">
                      Tidak ada data produk
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-[var(--bg-elevated)]">
                <tr>
                  <td colSpan={3} className="font-bold">TOTAL</td>
                  <td className="text-right font-bold text-blue-400">{formatCurrency(totalMasterRevenue)}</td>
                  <td className="text-right font-bold text-red-400">{formatCurrency(totalMasterHPP)}</td>
                  <td className={`text-right font-bold ${totalMasterProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(totalMasterProfit)}
                  </td>
                  <td className={`text-right font-bold ${overallMargin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {overallMargin.toFixed(1)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const generateReport = () => {
    switch (reportType) {
      case 'transactions':
        return reportPeriod === 'today' ? generateDailyReport() :
               reportPeriod === 'week' ? generateDailyReport() :
               reportPeriod === 'month' ? generateMonthlyReport() :
               reportPeriod === 'year' ? generateYearlyReport() :
               generateDailyReport();
      case 'profit-loss':
        return generateProfitLossReport();
      case 'master-products':
        return generateMasterProductsReport();
      case 'fast-moving':
        return generateFastMovingReport();
      default:
        return generateDailyReport();
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="p-6 border-b border-[var(--border-color)]">
        <h3 className="font-display font-bold text-lg">Laporan & Analisis</h3>
      </div>
      <div className="p-6">
        {/* Report Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            className="input-field"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="transactions">Laporan Transaksi</option>
            <option value="profit-loss">Laporan Laba Rugi</option>
            <option value="master-products">Master Products (Daftar Harga)</option>
            <option value="fast-moving">Produk Laku Keras</option>
          </select>
          {reportType === 'transactions' || reportType === 'profit-loss' || reportType === 'fast-moving' ? (
            <select
              className="input-field"
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
            >
              <option value="today">Hari Ini</option>
              <option value="week">Minggu Ini</option>
              <option value="month">Bulan Ini</option>
              <option value="year">Tahun Ini</option>
              <option value="all">Semua</option>
            </select>
          ) : (
            <div className="text-sm text-[var(--text-muted)] py-2 px-4">
              Tidak ada filter periode (Data Master)
            </div>
          )}
          <button onClick={exportReport} className="btn-secondary flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Reports Content */}
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div>
            <h4 className="font-semibold mb-4">
              {reportType === 'transactions' && `Laporan Transaksi - ${getPeriodLabel()}`}
              {reportType === 'profit-loss' && `Laporan Laba Rugi - ${getPeriodLabel()}`}
              {reportType === 'master-products' && 'Master Products (Daftar Harga)'}
              {reportType === 'fast-moving' && `Produk Laku Keras - ${getPeriodLabel()}`}
            </h4>
            {generateReport()}
          </div>
        )}
      </div>

      {/* Hidden Print Component for Profit Loss */}
      {printProfitLoss && (
        <div className="hidden">
          <div ref={printRef}>
            {/* Header */}
            <div className="header">
              <div className="store-name">SATRIA ELEKTRONIK</div>
              <div className="report-title">LAPORAN LABA RUGI PER PRODUK</div>
              <div className="report-date">
                Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="report-date">
                Alamat: Jl Batalyon 323 Buaya Putih, Gerbang Pertama Batalyon
              </div>
            </div>

            {/* Table */}
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Produk</th>
                  <th>Varian</th>
                  <th className="text-right">Harga Jual</th>
                  <th className="text-right">HPP (Modal)</th>
                  <th className="text-right">Laba</th>
                  <th className="text-right">Margin</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const profitLossData: any[] = [];
                  let totalRevenue = 0;
                  let totalHPP = 0;
                  let totalProfit = 0;

                  products.forEach((product: Product) => {
                    product.variants?.forEach((variant: any) => {
                      const price = variant.price || 0;
                      const hpp = variant.hpp || 0;
                      const profit = price - hpp;
                      const margin = price > 0 ? ((profit / price) * 100) : 0;

                      totalRevenue += price;
                      totalHPP += hpp;
                      totalProfit += profit;

                      profitLossData.push({
                        productName: product.name,
                        variantName: variant.variantName || '-',
                        price,
                        hpp,
                        profit,
                        margin,
                      });
                    });
                  });

                  const overallMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;

                  return (
                    <>
                      {profitLossData.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>{item.productName}</td>
                          <td>{item.variantName}</td>
                          <td className="text-right">{formatCurrency(item.price)}</td>
                          <td className="text-right">{formatCurrency(item.hpp)}</td>
                          <td className={`text-right ${item.profit >= 0 ? 'positive' : 'negative'}`}>
                            {formatCurrency(item.profit)}
                          </td>
                          <td className={`text-right ${item.margin >= 0 ? 'positive' : 'negative'}`}>
                            {item.margin.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </>
                  );
                })()}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td colSpan={3} className="text-right">TOTAL</td>
                  <td className="text-right">
                    {(() => {
                      const totalRevenue = products.reduce((sum: number, product: Product) => {
                        return sum + (product.variants?.reduce((s: number, v: any) => s + (v.price || 0), 0) || 0);
                      }, 0);
                      return formatCurrency(totalRevenue);
                    })()}
                  </td>
                  <td className="text-right">
                    {(() => {
                      const totalHPP = products.reduce((sum: number, product: Product) => {
                        return sum + (product.variants?.reduce((s: number, v: any) => s + (v.hpp || 0), 0) || 0);
                      }, 0);
                      return formatCurrency(totalHPP);
                    })()}
                  </td>
                  <td className={`text-right ${(() => {
                    const totalProfit = products.reduce((sum: number, product: Product) => {
                      return sum + (product.variants?.reduce((s: number, v: any) => s + ((v.price || 0) - (v.hpp || 0)), 0) || 0);
                    }, 0);
                    return totalProfit >= 0 ? 'positive' : 'negative';
                  })()}`}>
                    {(() => {
                      const totalProfit = products.reduce((sum: number, product: Product) => {
                        return sum + (product.variants?.reduce((s: number, v: any) => s + ((v.price || 0) - (v.hpp || 0)), 0) || 0);
                      }, 0);
                      return formatCurrency(totalProfit);
                    })()}
                  </td>
                  <td className={`text-right ${(() => {
                    const totalRevenue = products.reduce((sum: number, product: Product) => {
                      return sum + (product.variants?.reduce((s: number, v: any) => s + (v.price || 0), 0) || 0);
                    }, 0);
                    const totalProfit = products.reduce((sum: number, product: Product) => {
                      return sum + (product.variants?.reduce((s: number, v: any) => s + ((v.price || 0) - (v.hpp || 0)), 0) || 0);
                    }, 0);
                    const overallMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;
                    return overallMargin >= 0 ? 'positive' : 'negative';
                  })()}`}>
                    {(() => {
                      const totalRevenue = products.reduce((sum: number, product: Product) => {
                        return sum + (product.variants?.reduce((s: number, v: any) => s + (v.price || 0), 0) || 0);
                      }, 0);
                      const totalProfit = products.reduce((sum: number, product: Product) => {
                        return sum + (product.variants?.reduce((s: number, v: any) => s + ((v.price || 0) - (v.hpp || 0)), 0) || 0);
                      }, 0);
                      const overallMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;
                      return overallMargin.toFixed(1) + '%';
                    })()}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Summary */}
            <div className="summary">
              <div className="summary-row">
                <span>Total Revenue:</span>
                <span>
                  {(() => {
                    const totalRevenue = products.reduce((sum: number, product: Product) => {
                      return sum + (product.variants?.reduce((s: number, v: any) => s + (v.price || 0), 0) || 0);
                    }, 0);
                    return formatCurrency(totalRevenue);
                  })()}
                </span>
              </div>
              <div className="summary-row">
                <span>Total HPP (Modal):</span>
                <span>
                  {(() => {
                    const totalHPP = products.reduce((sum: number, product: Product) => {
                      return sum + (product.variants?.reduce((s: number, v: any) => s + (v.hpp || 0), 0) || 0);
                    }, 0);
                    return formatCurrency(totalHPP);
                  })()}
                </span>
              </div>
              <div className="summary-row total-row">
                <span>Total Laba Bersih:</span>
                <span>
                  {(() => {
                    const totalProfit = products.reduce((sum: number, product: Product) => {
                      return sum + (product.variants?.reduce((s: number, v: any) => s + ((v.price || 0) - (v.hpp || 0)), 0) || 0);
                    }, 0);
                    return formatCurrency(totalProfit);
                  })()}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="footer">
              <p>Laporan ini dibuat secara otomatis oleh sistem TokoKu</p>
              <p>Terima Kasih atas kepercayaan Anda</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
