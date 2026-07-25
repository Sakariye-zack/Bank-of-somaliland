import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../lib/api';
import type { Faq } from '@bos/shared-types';

type FaqRow = Faq & {
  question_so?: string | null;
  question_ar?: string | null;
  answer_so?: string | null;
  answer_ar?: string | null;
  sort_order: number;
  is_active: boolean;
};

export function FaqsAdmin() {
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [form, setForm] = useState({
    question: '',
    question_so: '',
    question_ar: '',
    answer: '',
    answer_so: '',
    answer_ar: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    question: '',
    question_so: '',
    question_ar: '',
    answer: '',
    answer_so: '',
    answer_ar: '',
  });

  function load() {
    api
      .faqs()
      .then((r) => setFaqs(r.results.sort((a, b) => a.sort_order - b.sort_order)))
      .catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const nextOrder = faqs.length > 0 ? Math.max(...faqs.map((f) => f.sort_order)) + 1 : 1;
      await api.createFaq({
        question: form.question,
        question_so: form.question_so || undefined,
        question_ar: form.question_ar || undefined,
        answer: form.answer,
        answer_so: form.answer_so || undefined,
        answer_ar: form.answer_ar || undefined,
        sort_order: nextOrder,
      });
      setMessage('FAQ added.');
      setForm({ question: '', question_so: '', question_ar: '', answer: '', answer_so: '', answer_ar: '' });
      load();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Failed to add FAQ.');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(faq: FaqRow) {
    await api.updateFaq(faq.id, { is_active: !faq.is_active });
    load();
  }

  async function move(faq: FaqRow, direction: -1 | 1) {
    const idx = faqs.findIndex((f) => f.id === faq.id);
    const swapWith = faqs[idx + direction];
    if (!swapWith) return;
    await Promise.all([
      api.updateFaq(faq.id, { sort_order: swapWith.sort_order }),
      api.updateFaq(swapWith.id, { sort_order: faq.sort_order }),
    ]);
    load();
  }

  async function remove(faq: FaqRow) {
    if (!confirm(`Remove this FAQ? This cannot be undone.`)) return;
    await api.deleteFaq(faq.id);
    load();
  }

  function startEdit(faq: FaqRow) {
    setEditingId(faq.id);
    setEditForm({
      question: faq.question,
      question_so: faq.question_so ?? '',
      question_ar: faq.question_ar ?? '',
      answer: faq.answer,
      answer_so: faq.answer_so ?? '',
      answer_ar: faq.answer_ar ?? '',
    });
  }

  async function saveEdit(faq: FaqRow) {
    await api.updateFaq(faq.id, {
      question: editForm.question,
      question_so: editForm.question_so || null,
      question_ar: editForm.question_ar || null,
      answer: editForm.answer,
      answer_so: editForm.answer_so || null,
      answer_ar: editForm.answer_ar || null,
    });
    setEditingId(null);
    load();
  }

  return (
    <>
      <h1>Frequently Asked Questions</h1>
      <div className="card">
        <p style={{ marginTop: 0, fontSize: 13, color: 'var(--bronze)' }}>
          These FAQs appear on the public /faq page as an accordion. Use "Hide" to pull an entry out of the public
          list without deleting it.
        </p>
        {message && <div className="status-ok">{message}</div>}
        {error && <div className="status-error">{error}</div>}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Add a FAQ</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Question (English)</label>
            <input required value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Question (Somali, optional)</label>
            <input value={form.question_so} onChange={(e) => setForm({ ...form, question_so: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Question (Arabic, optional)</label>
            <input value={form.question_ar} onChange={(e) => setForm({ ...form, question_ar: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Answer (English)</label>
            <textarea
              required
              rows={3}
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
            />
          </div>
          <div className="form-row">
            <label>Answer (Somali, optional)</label>
            <textarea rows={3} value={form.answer_so} onChange={(e) => setForm({ ...form, answer_so: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Answer (Arabic, optional)</label>
            <textarea rows={3} value={form.answer_ar} onChange={(e) => setForm({ ...form, answer_ar: e.target.value })} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add FAQ'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Current FAQs ({faqs.length})</h3>
        {faqs.length === 0 && <p style={{ color: 'var(--bronze)' }}>No FAQs yet — add the first one above.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((faq, i) => (
            <div
              key={faq.id}
              style={{
                border: '1px solid var(--line)',
                borderRadius: 6,
                padding: 10,
                opacity: faq.is_active ? 1 : 0.55,
              }}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{faq.question}</div>
                  <div style={{ fontSize: 12, color: 'var(--bronze)', marginTop: 2 }}>{faq.answer}</div>
                  <span className={`status-pill ${faq.is_active ? 'status-active' : 'status-revoked'}`}>
                    {faq.is_active ? 'shown' : 'hidden'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    className="btn"
                    style={{ padding: '6px 10px', fontSize: 12, background: 'var(--parchment-2)' }}
                    disabled={i === 0}
                    onClick={() => move(faq, -1)}
                    title="Move earlier"
                  >
                    ↑
                  </button>
                  <button
                    className="btn"
                    style={{ padding: '6px 10px', fontSize: 12, background: 'var(--parchment-2)' }}
                    disabled={i === faqs.length - 1}
                    onClick={() => move(faq, 1)}
                    title="Move later"
                  >
                    ↓
                  </button>
                  <button
                    className="btn"
                    style={{ padding: '6px 12px', fontSize: 12, background: 'var(--parchment-2)' }}
                    onClick={() => (editingId === faq.id ? setEditingId(null) : startEdit(faq))}
                  >
                    {editingId === faq.id ? 'Cancel' : 'Edit'}
                  </button>
                  <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => toggleActive(faq)}>
                    {faq.is_active ? 'Hide' : 'Show'}
                  </button>
                  <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => remove(faq)}>
                    Delete
                  </button>
                </div>
              </div>
              {editingId === faq.id && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                  <div className="form-row" style={{ margin: 0 }}>
                    <label>Question (EN)</label>
                    <input value={editForm.question} onChange={(e) => setEditForm({ ...editForm, question: e.target.value })} />
                  </div>
                  <div className="form-row" style={{ margin: 0 }}>
                    <label>Question (SO)</label>
                    <input value={editForm.question_so} onChange={(e) => setEditForm({ ...editForm, question_so: e.target.value })} />
                  </div>
                  <div className="form-row" style={{ margin: 0 }}>
                    <label>Question (AR)</label>
                    <input value={editForm.question_ar} onChange={(e) => setEditForm({ ...editForm, question_ar: e.target.value })} />
                  </div>
                  <div />
                  <div className="form-row" style={{ margin: 0 }}>
                    <label>Answer (EN)</label>
                    <textarea rows={3} value={editForm.answer} onChange={(e) => setEditForm({ ...editForm, answer: e.target.value })} />
                  </div>
                  <div className="form-row" style={{ margin: 0 }}>
                    <label>Answer (SO)</label>
                    <textarea rows={3} value={editForm.answer_so} onChange={(e) => setEditForm({ ...editForm, answer_so: e.target.value })} />
                  </div>
                  <div className="form-row" style={{ margin: 0 }}>
                    <label>Answer (AR)</label>
                    <textarea rows={3} value={editForm.answer_ar} onChange={(e) => setEditForm({ ...editForm, answer_ar: e.target.value })} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => saveEdit(faq)}>
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
