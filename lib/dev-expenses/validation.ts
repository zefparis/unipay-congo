export interface CreateExpenseForm {
  title: string;
  creditor_id: string;
  category: string;
  project_ref: string;
  invoice_number: string;
  invoice_date: string;
  billing_month: string;
  due_date: string;
  invoice_amount: string;
  invoice_currency: string;
  description: string;
  incurred_by_entity_id: string;
  initially_paid_by_entity_id: string;
  covered_by_entity_id: string;
  reimbursement_recipient_entity_id: string;
  initial_payment_status: string;
  initial_payment_method: string;
  requested_amount: string;
}

export const EMPTY_FORM: CreateExpenseForm = {
  title: '',
  creditor_id: '',
  category: '',
  project_ref: '',
  invoice_number: '',
  invoice_date: '',
  billing_month: new Date().toISOString().slice(0, 7) + '-01',
  due_date: '',
  invoice_amount: '',
  invoice_currency: 'USD',
  description: '',
  incurred_by_entity_id: '',
  initially_paid_by_entity_id: '',
  covered_by_entity_id: '',
  reimbursement_recipient_entity_id: '',
  initial_payment_status: 'unpaid',
  initial_payment_method: '',
  requested_amount: '',
};

export interface FormErrors {
  [key: string]: string | undefined;
}

export function validateCreateForm(form: CreateExpenseForm): FormErrors {
  const errors: FormErrors = {};

  if (!form.title.trim()) {
    errors.title = 'L\'objet est obligatoire';
  }
  if (!form.category.trim()) {
    errors.category = 'La catégorie est obligatoire';
  }
  if (!form.billing_month) {
    errors.billing_month = 'Le mois de facturation est obligatoire';
  }
  if (!form.invoice_amount || parseFloat(form.invoice_amount) <= 0) {
    errors.invoice_amount = 'Le montant doit être supérieur à 0';
  }
  if (!form.invoice_currency) {
    errors.invoice_currency = 'La devise est obligatoire';
  }
  if (!form.incurred_by_entity_id) {
    errors.incurred_by_entity_id = 'L\'entité ayant engagé la dépense est obligatoire';
  }
  if (!form.covered_by_entity_id) {
    errors.covered_by_entity_id = 'L\'entité de prise en charge est obligatoire';
  }
  if (!form.initial_payment_status) {
    errors.initial_payment_status = 'La situation du paiement est obligatoire';
  }

  return errors;
}

export function formToApiPayload(form: CreateExpenseForm): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    title: form.title.trim(),
    category: form.category.trim(),
    billing_month: form.billing_month,
    invoice_currency: form.invoice_currency,
    project_code: 'unipay-congo',
    initial_payment_status: form.initial_payment_status,
  };

  if (form.creditor_id) payload.creditor_id = form.creditor_id;
  if (form.project_ref.trim()) payload.project_ref = form.project_ref.trim();
  if (form.invoice_number.trim()) payload.invoice_number = form.invoice_number.trim();
  if (form.invoice_date) payload.invoice_date = form.invoice_date;
  if (form.due_date) payload.due_date = form.due_date;
  if (form.invoice_amount) payload.invoice_amount = parseFloat(form.invoice_amount);
  if (form.description.trim()) payload.description = form.description.trim();
  if (form.incurred_by_entity_id) payload.incurred_by_entity_id = form.incurred_by_entity_id;
  if (form.initially_paid_by_entity_id) payload.initially_paid_by_entity_id = form.initially_paid_by_entity_id;
  if (form.covered_by_entity_id) payload.covered_by_entity_id = form.covered_by_entity_id;
  if (form.reimbursement_recipient_entity_id) payload.reimbursement_recipient_entity_id = form.reimbursement_recipient_entity_id;
  if (form.initial_payment_method) payload.initial_payment_method = form.initial_payment_method;
  if (form.requested_amount) {
    payload.requested_amount = parseFloat(form.requested_amount);
  } else if (form.invoice_amount) {
    payload.requested_amount = parseFloat(form.invoice_amount);
  }

  return payload;
}
