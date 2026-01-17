import { useEffect, useState } from 'react';
import axios from 'axios';

const Portal = () => {
  const [me, setMe] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [amcs, setAmcs] = useState([]);
  const [payments, setPayments] = useState([]);
  const token = localStorage.getItem('portalToken');

  useEffect(() => {
    if (!token) { window.location.href = '/portal/login'; return; }
    const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });
    api.interceptors.request.use((config)=>{ config.headers.Authorization = `Bearer ${token}`; return config; });
    Promise.all([
      api.get('/portal/me'),
      api.get('/portal/quotations'),
      api.get('/portal/invoices'),
      api.get('/portal/amcs'),
      api.get('/portal/payments'),
    ]).then(([meRes,qRes,iRes,aRes,pRes]) => {
      setMe(meRes.data.data); setQuotations(qRes.data.data); setInvoices(iRes.data.data); setAmcs(aRes.data.data); setPayments(pRes.data.data);
    }).catch(()=>{ localStorage.removeItem('portalToken'); window.location.href = '/portal/login'; });
  }, []);

  if (!token) return null;
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Client Portal</h1>
      {me && <div className="mb-6">Welcome, <b>{me.name}</b></div>}
      <div className="grid md:grid-cols-2 gap-6">
        <section className="card"><h2 className="font-semibold mb-2">Quotations</h2><ul>{quotations.slice(0,5).map(q=> <li key={q._id}>{q.quotationNumber || q._id} - {q.status}</li>)}</ul></section>
        <section className="card"><h2 className="font-semibold mb-2">Invoices</h2><ul>{invoices.slice(0,5).map(i=> <li key={i._id}>{i.invoiceNumber || i._id} - {i.status}</li>)}</ul></section>
        <section className="card"><h2 className="font-semibold mb-2">AMCs</h2><ul>{amcs.slice(0,5).map(a=> <li key={a._id}>{a.contractNumber || a._id} - {a.status || 'Active'}</li>)}</ul></section>
        <section className="card"><h2 className="font-semibold mb-2">Payments</h2><ul>{payments.slice(0,5).map(p=> <li key={p._id}>{p.amount} - {new Date(p.paymentDate).toLocaleDateString()}</li>)}</ul></section>
      </div>
    </div>
  );
};

export default Portal;
