'use client';

import { Download, Printer, Mail } from 'lucide-react';
import type { Invoice } from './types';

interface InvoiceGeneratorProps {
  invoice: Invoice;
  onDownload?: () => void;
  onPrint?: () => void;
  onEmail?: () => void;
}

export function InvoiceGenerator({ invoice, onDownload, onPrint, onEmail }: InvoiceGeneratorProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const companyInfo = {
    name: 'AdStack Inc.',
    address: '123 Business Street',
    city: 'San Francisco, CA 94102',
    country: 'United States',
    email: 'billing@adstack.com',
    phone: '+1 (555) 123-4567',
    taxId: '12-3456789',
  };

  const customerInfo = {
    name: invoice.paymentMethod?.billingDetails.name || 'Customer Name',
    email: invoice.paymentMethod?.billingDetails.email || 'customer@example.com',
    address: invoice.paymentMethod?.billingDetails.address
      ? `${invoice.paymentMethod.billingDetails.address.line1}${
          invoice.paymentMethod.billingDetails.address.line2
            ? ', ' + invoice.paymentMethod.billingDetails.address.line2
            : ''
        }`
      : '',
    city: invoice.paymentMethod?.billingDetails.address
      ? `${invoice.paymentMethod.billingDetails.address.city}, ${invoice.paymentMethod.billingDetails.address.state} ${invoice.paymentMethod.billingDetails.address.postalCode}`
      : '',
    country: invoice.paymentMethod?.billingDetails.address.country || '',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Actions Bar */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Invoice</h1>
        <div className="flex gap-3">
          <button
            onClick={onEmail}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            <Mail className="w-4 h-4 mr-2" />
            Email
          </button>
          <button
            onClick={onPrint}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </button>
          <button
            onClick={onDownload}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Invoice Document */}
      <div className="bg-white rounded-lg shadow-lg p-12 print:shadow-none">
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <h2 className="text-4xl font-bold text-blue-600 mb-2">{companyInfo.name}</h2>
            <div className="text-gray-600 text-sm">
              <p>{companyInfo.address}</p>
              <p>{companyInfo.city}</p>
              <p>{companyInfo.country}</p>
              <p className="mt-2">{companyInfo.email}</p>
              <p>{companyInfo.phone}</p>
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h3>
            <div className="text-sm">
              <p className="text-gray-600">Invoice Number</p>
              <p className="font-semibold text-gray-900 mb-3">{invoice.number}</p>
              <p className="text-gray-600">Invoice Date</p>
              <p className="font-semibold text-gray-900 mb-3">{formatDate(invoice.date)}</p>
              <p className="text-gray-600">Due Date</p>
              <p className="font-semibold text-gray-900">{formatDate(invoice.dueDate)}</p>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-12">
          <h4 className="text-sm font-semibold text-gray-600 uppercase mb-3">Bill To:</h4>
          <div className="text-gray-900">
            <p className="font-semibold text-lg">{customerInfo.name}</p>
            <p className="text-sm">{customerInfo.email}</p>
            {customerInfo.address && (
              <>
                <p className="text-sm mt-2">{customerInfo.address}</p>
                <p className="text-sm">{customerInfo.city}</p>
                <p className="text-sm">{customerInfo.country}</p>
              </>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-3 text-sm font-semibold text-gray-700 uppercase">
                  Description
                </th>
                <th className="text-right py-3 text-sm font-semibold text-gray-700 uppercase">
                  Quantity
                </th>
                <th className="text-right py-3 text-sm font-semibold text-gray-700 uppercase">
                  Unit Price
                </th>
                <th className="text-right py-3 text-sm font-semibold text-gray-700 uppercase">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-4 text-gray-900">{item.description}</td>
                  <td className="py-4 text-right text-gray-900">{item.quantity}</td>
                  <td className="py-4 text-right text-gray-900">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="py-4 text-right font-semibold text-gray-900">
                    ${item.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-12">
          <div className="w-64">
            <div className="flex justify-between py-2 text-gray-700">
              <span>Subtotal:</span>
              <span className="font-semibold">${invoice.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 text-gray-700 border-b border-gray-200">
              <span>Tax:</span>
              <span className="font-semibold">${invoice.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-3 text-lg font-bold text-gray-900">
              <span>Total:</span>
              <span>${invoice.total.toFixed(2)} {invoice.currency}</span>
            </div>
            {invoice.status === 'paid' && invoice.paidDate && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-green-800">PAID</p>
                <p className="text-xs text-green-700">Paid on {formatDate(invoice.paidDate)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Information */}
        {invoice.paymentMethod && invoice.status === 'paid' && (
          <div className="mb-8 pb-8 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-600 uppercase mb-3">
              Payment Information:
            </h4>
            <div className="text-sm text-gray-700">
              <p>
                Payment Method:{' '}
                <span className="font-semibold capitalize">
                  {invoice.paymentMethod.brand} •••• {invoice.paymentMethod.last4}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="mb-8">
          <h4 className="text-sm font-semibold text-gray-600 uppercase mb-3">Notes:</h4>
          <p className="text-sm text-gray-700">
            Thank you for your business! This invoice represents your subscription to AdStack
            services. If you have any questions, please contact us at {companyInfo.email}.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            {companyInfo.name} | Tax ID: {companyInfo.taxId}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            This is a computer-generated invoice. No signature required.
          </p>
        </div>
      </div>

      {/* Additional Actions */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Need help with this invoice?</p>
            <p className="text-xs text-gray-600">
              Contact our billing team at {companyInfo.email}
            </p>
          </div>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
