/**
 * Pre-built OHADA Legal Templates Library
 * System templates that are protected and maintained by the application
 */

export const SYSTEM_TEMPLATES = [
  {
    id: 'company-bylaws-sarl',
    name: 'Bylaws - SARL',
    category: 'COMPANY',
    description: 'Bylaws for a Private Limited Company (SARL)',
    countries: ['CM', 'GA', 'CI', 'SN'],
    ohada_act: 'ACT2',
    applicable_articles: ['Art. 157-192'],
    legal_version: '2022',
    model_version: '1.0.0',
    type: 'SYSTEM',
    status: 'VALIDATED',
    variables: {
      company_name: { label: 'Company Name', type: 'text', required: true },
      registration_number: { label: 'Registration Number', type: 'text', required: false },
      headquarters_address: { label: 'Headquarters Address', type: 'textarea', required: true },
      share_capital: { label: 'Share Capital', type: 'currency', required: true },
      number_of_shares: { label: 'Number of Shares', type: 'number', required: true },
      partners: { label: 'Partners', type: 'textarea', required: true },
      managing_director: { label: 'Managing Director', type: 'text', required: true }
    },
    mandatory_clauses: ['Definition of Partners', 'Share Capital', 'Management Structure', 'Amendment Procedure'],
    optional_clauses: ['Dispute Resolution', 'Dissolution Procedure'],
    conditional_clauses: [],
    metadata: {
      language: 'French/English',
      jurisdiction: 'OHADA Zone',
      last_updated: '2022-01-15'
    }
  },
  {
    id: 'company-bylaws-sa',
    name: 'Bylaws - SA (Public Limited Company)',
    category: 'COMPANY',
    description: 'Bylaws for a Public Limited Company (SA)',
    countries: ['CM', 'GA', 'CI', 'SN'],
    ohada_act: 'ACT2',
    applicable_articles: ['Art. 210-277'],
    legal_version: '2022',
    model_version: '1.0.0',
    type: 'SYSTEM',
    status: 'VALIDATED',
    variables: {
      company_name: { label: 'Company Name', type: 'text', required: true },
      registration_number: { label: 'Registration Number', type: 'text', required: false },
      headquarters_address: { label: 'Headquarters Address', type: 'textarea', required: true },
      share_capital: { label: 'Share Capital', type: 'currency', required: true },
      number_of_shares: { label: 'Number of Shares', type: 'number', required: true },
      share_price: { label: 'Share Price', type: 'currency', required: true },
      board_members: { label: 'Board Members', type: 'textarea', required: true }
    },
    mandatory_clauses: ['Board of Directors', 'Shareholders Assembly', 'Share Capital', 'Financial Controls'],
    optional_clauses: ['Advisory Board', 'Executive Committee'],
    conditional_clauses: [],
    metadata: {
      language: 'French/English',
      jurisdiction: 'OHADA Zone',
      complexity: 'High'
    }
  },
  {
    id: 'pv-shareholders-meeting',
    name: 'Minutes - Shareholders Meeting',
    category: 'COMPANY',
    description: 'Minutes of Shareholders Meeting - PLC',
    countries: ['CM', 'GA', 'CI', 'SN'],
    ohada_act: 'ACT2',
    applicable_articles: ['Art. 381-395'],
    legal_version: '2022',
    model_version: '1.0.0',
    type: 'SYSTEM',
    status: 'VALIDATED',
    variables: {
      company_name: { label: 'Company Name', type: 'text', required: true },
      meeting_date: { label: 'Meeting Date', type: 'date', required: true },
      location: { label: 'Location', type: 'text', required: true },
      attendees: { label: 'Attendees', type: 'textarea', required: true },
      agenda_items: { label: 'Agenda Items', type: 'textarea', required: true },
      resolutions: { label: 'Resolutions', type: 'textarea', required: true },
      signature_date: { label: 'Signature Date', type: 'date', required: true }
    },
    mandatory_clauses: ['Attendance Verification', 'Agenda', 'Resolutions', 'Signatures'],
    optional_clauses: ['Certified Translation', 'Attached Documents'],
    conditional_clauses: [],
    metadata: {
      language: 'French/English',
      jurisdiction: 'OHADA Zone'
    }
  },
  {
    id: 'commercial-contract',
    name: 'Commercial Contract',
    category: 'CONTRACTS',
    description: 'General Commercial Contract - OHADA Compliant',
    countries: ['CM', 'GA', 'CI', 'SN'],
    ohada_act: 'ACT1',
    applicable_articles: ['Art. 105-146'],
    legal_version: '2022',
    model_version: '1.0.0',
    type: 'SYSTEM',
    status: 'VALIDATED',
    variables: {
      supplier_name: { label: 'Supplier Name', type: 'text', required: true },
      supplier_address: { label: 'Supplier Address', type: 'textarea', required: true },
      buyer_name: { label: 'Buyer Name', type: 'text', required: true },
      buyer_address: { label: 'Buyer Address', type: 'textarea', required: true },
      goods_description: { label: 'Goods Description', type: 'textarea', required: true },
      quantity: { label: 'Quantity', type: 'number', required: true },
      unit_price: { label: 'Unit Price', type: 'currency', required: true },
      total_price: { label: 'Total Price', type: 'currency', required: true },
      delivery_date: { label: 'Delivery Date', type: 'date', required: true },
      payment_terms: { label: 'Payment Terms', type: 'textarea', required: true }
    },
    mandatory_clauses: ['Identification of Parties', 'Goods Description', 'Price', 'Delivery Terms', 'Payment Terms'],
    optional_clauses: ['Warranty', 'Dispute Resolution', 'Insurance'],
    conditional_clauses: ['Late Delivery Penalties'],
    metadata: {
      language: 'French/English',
      jurisdiction: 'OHADA Zone'
    }
  },
  {
    id: 'invoice',
    name: 'Invoice',
    category: 'FINANCIAL',
    description: 'Commercial Invoice - OHADA Format',
    countries: ['CM', 'GA', 'CI', 'SN'],
    ohada_act: 'ACT1',
    applicable_articles: ['Art. 51-72'],
    legal_version: '2022',
    model_version: '1.0.0',
    type: 'SYSTEM',
    status: 'VALIDATED',
    variables: {
      invoice_number: { label: 'Invoice Number', type: 'text', required: true },
      invoice_date: { label: 'Invoice Date', type: 'date', required: true },
      supplier_company: { label: 'Supplier Company', type: 'text', required: true },
      supplier_tax_id: { label: 'Tax ID', type: 'text', required: true },
      buyer_company: { label: 'Buyer Company', type: 'text', required: true },
      line_items: { label: 'Line Items', type: 'textarea', required: true },
      subtotal: { label: 'Subtotal', type: 'currency', required: true },
      tax_rate: { label: 'Tax Rate %', type: 'percentage', required: true },
      tax_amount: { label: 'Tax Amount', type: 'currency', required: true },
      total_amount: { label: 'Total Amount Due', type: 'currency', required: true },
      payment_due_date: { label: 'Payment Due Date', type: 'date', required: true }
    },
    mandatory_clauses: ['Invoice Number and Date', 'Supplier Information', 'Buyer Information', 'Line Items', 'Total Amount', 'Tax Information'],
    optional_clauses: ['Payment Method', 'Notes', 'Terms and Conditions'],
    conditional_clauses: [],
    metadata: {
      language: 'French/English',
      jurisdiction: 'OHADA Zone'
    }
  },
  {
    id: 'quotation',
    name: 'Quotation / Offer',
    category: 'FINANCIAL',
    description: 'Commercial Quotation - OHADA Compliant',
    countries: ['CM', 'GA', 'CI', 'SN'],
    ohada_act: 'ACT1',
    applicable_articles: ['Art. 107-108'],
    legal_version: '2022',
    model_version: '1.0.0',
    type: 'SYSTEM',
    status: 'VALIDATED',
    variables: {
      quote_number: { label: 'Quote Number', type: 'text', required: true },
      quote_date: { label: 'Quote Date', type: 'date', required: true },
      validity_period: { label: 'Validity Period (days)', type: 'number', required: true },
      supplier_name: { label: 'Supplier Name', type: 'text', required: true },
      buyer_name: { label: 'Buyer Name', type: 'text', required: true },
      line_items: { label: 'Line Items', type: 'textarea', required: true },
      subtotal: { label: 'Subtotal', type: 'currency', required: true },
      tax_amount: { label: 'Tax Amount', type: 'currency', required: true },
      total_amount: { label: 'Total Amount', type: 'currency', required: true },
      terms: { label: 'Terms and Conditions', type: 'textarea', required: true }
    },
    mandatory_clauses: ['Quote Number and Date', 'Validity Period', 'Goods/Services Description', 'Price', 'Conditions'],
    optional_clauses: ['Payment Terms', 'Delivery Conditions', 'Warranty'],
    conditional_clauses: [],
    metadata: {
      language: 'French/English',
      jurisdiction: 'OHADA Zone'
    }
  },
  {
    id: 'delivery-receipt',
    name: 'Delivery Receipt',
    category: 'DELIVERY',
    description: 'Delivery Note / Packing Slip - OHADA Format',
    countries: ['CM', 'GA', 'CI', 'SN'],
    ohada_act: 'ACT1',
    applicable_articles: ['Art. 51-72'],
    legal_version: '2022',
    model_version: '1.0.0',
    type: 'SYSTEM',
    status: 'VALIDATED',
    variables: {
      delivery_number: { label: 'Delivery Number', type: 'text', required: true },
      delivery_date: { label: 'Delivery Date', type: 'date', required: true },
      supplier_name: { label: 'Supplier Name', type: 'text', required: true },
      buyer_name: { label: 'Buyer Name', type: 'text', required: true },
      order_number: { label: 'Related Order Number', type: 'text', required: false },
      items: { label: 'Items Delivered', type: 'textarea', required: true },
      quantity_delivered: { label: 'Quantity Delivered', type: 'number', required: true },
      receiver_name: { label: 'Receiver Name', type: 'text', required: true },
      receiver_signature: { label: 'Receiver Signature', type: 'text', required: false },
      comments: { label: 'Comments/Notes', type: 'textarea', required: false }
    },
    mandatory_clauses: ['Delivery Number and Date', 'Supplier and Buyer Information', 'Items Description', 'Quantity', 'Receiver Information'],
    optional_clauses: ['Quality Check', 'Damage Report', 'Special Instructions'],
    conditional_clauses: [],
    metadata: {
      language: 'French/English',
      jurisdiction: 'OHADA Zone'
    }
  },
  {
    id: 'purchase-order',
    name: 'Purchase Order',
    category: 'FINANCIAL',
    description: 'Purchase Order - OHADA Compliant',
    countries: ['CM', 'GA', 'CI', 'SN'],
    ohada_act: 'ACT1',
    applicable_articles: ['Art. 105-110'],
    legal_version: '2022',
    model_version: '1.0.0',
    type: 'SYSTEM',
    status: 'VALIDATED',
    variables: {
      po_number: { label: 'PO Number', type: 'text', required: true },
      po_date: { label: 'PO Date', type: 'date', required: true },
      buyer_company: { label: 'Buyer Company', type: 'text', required: true },
      buyer_address: { label: 'Buyer Address', type: 'textarea', required: true },
      supplier_company: { label: 'Supplier Company', type: 'text', required: true },
      supplier_address: { label: 'Supplier Address', type: 'textarea', required: true },
      items: { label: 'Items Ordered', type: 'textarea', required: true },
      total_amount: { label: 'Total Amount', type: 'currency', required: true },
      delivery_date: { label: 'Required Delivery Date', type: 'date', required: true },
      terms: { label: 'Terms and Conditions', type: 'textarea', required: true }
    },
    mandatory_clauses: ['PO Number and Date', 'Buyer and Supplier Information', 'Items Description', 'Price and Total', 'Delivery Terms'],
    optional_clauses: ['Payment Terms', 'Inspection Requirements', 'Return Policy'],
    conditional_clauses: [],
    metadata: {
      language: 'French/English',
      jurisdiction: 'OHADA Zone'
    }
  },
  {
    id: 'receipt',
    name: 'Receipt of Payment',
    category: 'FINANCIAL',
    description: 'Receipt Acknowledgment - OHADA Format',
    countries: ['CM', 'GA', 'CI', 'SN'],
    ohada_act: 'ACT1',
    applicable_articles: ['Art. 51-72'],
    legal_version: '2022',
    model_version: '1.0.0',
    type: 'SYSTEM',
    status: 'VALIDATED',
    variables: {
      receipt_number: { label: 'Receipt Number', type: 'text', required: true },
      receipt_date: { label: 'Receipt Date', type: 'date', required: true },
      from: { label: 'Received From', type: 'text', required: true },
      amount: { label: 'Amount', type: 'currency', required: true },
      for: { label: 'For', type: 'textarea', required: true },
      payment_method: { label: 'Payment Method', type: 'select', required: true, options: ['Cash', 'Check', 'Bank Transfer', 'Card'] },
      issued_by: { label: 'Issued By', type: 'text', required: true },
      company_name: { label: 'Company Name', type: 'text', required: true }
    },
    mandatory_clauses: ['Receipt Number and Date', 'Payer Information', 'Amount', 'Description', 'Signature'],
    optional_clauses: ['Tax Information', 'Reference Number'],
    conditional_clauses: [],
    metadata: {
      language: 'French/English',
      jurisdiction: 'OHADA Zone'
    }
  },
  {
    id: 'power-of-attorney',
    name: 'Power of Attorney',
    category: 'LEGAL_ACTS',
    description: 'Power of Attorney / Proxy - OHADA Compliant',
    countries: ['CM', 'GA', 'CI', 'SN'],
    ohada_act: 'ACT1',
    applicable_articles: ['Art. 167-177'],
    legal_version: '2022',
    model_version: '1.0.0',
    type: 'SYSTEM',
    status: 'VALIDATED',
    variables: {
      principal_name: { label: 'Principal Name', type: 'text', required: true },
      principal_address: { label: 'Principal Address', type: 'textarea', required: true },
      agent_name: { label: 'Agent/Attorney Name', type: 'text', required: true },
      agent_address: { label: 'Agent Address', type: 'textarea', required: true },
      powers_granted: { label: 'Powers Granted', type: 'textarea', required: true },
      effective_date: { label: 'Effective Date', type: 'date', required: true },
      expiry_date: { label: 'Expiry Date', type: 'date', required: false },
      location: { label: 'Location', type: 'text', required: true },
      signature_date: { label: 'Signature Date', type: 'date', required: true }
    },
    mandatory_clauses: ['Parties Identification', 'Powers Granted', 'Effective Date', 'Signature'],
    optional_clauses: ['Revocation Clause', 'Limitation of Powers', 'Compensation'],
    conditional_clauses: [],
    metadata: {
      language: 'French/English',
      jurisdiction: 'OHADA Zone'
    }
  },
  {
    id: 'demand-letter',
    name: 'Demand Letter / Cease & Desist',
    category: 'CORRESPONDENCE',
    description: 'Legal Demand Letter - OHADA Format',
    countries: ['CM', 'GA', 'CI', 'SN'],
    ohada_act: 'ACT1',
    applicable_articles: ['Art. 1-50'],
    legal_version: '2022',
    model_version: '1.0.0',
    type: 'SYSTEM',
    status: 'VALIDATED',
    variables: {
      sender_company: { label: 'Sender Company', type: 'text', required: true },
      sender_address: { label: 'Sender Address', type: 'textarea', required: true },
      recipient_name: { label: 'Recipient Name', type: 'text', required: true },
      recipient_address: { label: 'Recipient Address', type: 'textarea', required: true },
      letter_date: { label: 'Letter Date', type: 'date', required: true },
      issue_description: { label: 'Issue Description', type: 'textarea', required: true },
      demand: { label: 'Demand', type: 'textarea', required: true },
      deadline: { label: 'Deadline for Compliance', type: 'date', required: true },
      signature: { label: 'Signature', type: 'text', required: false }
    },
    mandatory_clauses: ['Parties Identification', 'Issue Description', 'Demand', 'Deadline'],
    optional_clauses: ['Reference to Agreements', 'Legal Consequences'],
    conditional_clauses: [],
    metadata: {
      language: 'French/English',
      jurisdiction: 'OHADA Zone'
    }
  }
];

export const getSystemTemplateById = (id) => {
  return SYSTEM_TEMPLATES.find(t => t.id === id);
};

export const getSystemTemplatesByCategory = (category) => {
  return SYSTEM_TEMPLATES.filter(t => t.category === category);
};

export const getSystemTemplatesByCountry = (country) => {
  return SYSTEM_TEMPLATES.filter(t => t.countries.includes(country));
};

export default SYSTEM_TEMPLATES;
